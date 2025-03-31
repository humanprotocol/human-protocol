import {
  ChainId,
  EscrowUtils,
  OperatorUtils,
  StakingClient,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { EventType, ReputationEntityType } from '../../common/enums';
import { isDuplicatedError } from '../../common/errors/database';
import { ServerConfigService } from '../../config/server-config.service';
import logger from '../../logger';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { AbuseDecision, AbuseStatus } from './constants';
import {
  isInteractiveMessage,
  isViewSubmission,
  ReportAbuseInput,
  SlackInteraction,
} from './types';
import { AbuseSlackBot } from './abuse.slack-bot';

@Injectable()
export class AbuseService {
  private readonly logger = logger.child({
    context: AbuseService.name,
  });

  constructor(
    private readonly abuseSlackBot: AbuseSlackBot,
    private readonly abuseRepository: AbuseRepository,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
    private readonly reputationService: ReputationService,
    private readonly webhookOutgoingService: WebhookOutgoingService,
  ) {}

  async reportAbuse(data: ReportAbuseInput): Promise<void> {
    const abuseEntity = new AbuseEntity();
    abuseEntity.escrowAddress = data.escrowAddress;
    abuseEntity.chainId = data.chainId;
    abuseEntity.userId = data.userId;
    abuseEntity.status = AbuseStatus.PENDING;
    abuseEntity.retriesCount = 0;
    abuseEntity.waitUntil = new Date();

    await this.abuseRepository.createUnique(abuseEntity);
  }

  private async slashAccount(data: {
    slasher: string;
    staker: string;
    chainId: ChainId;
    escrowAddress: string;
    amount: number;
  }) {
    const signer = this.web3Service.getSigner(data.chainId);
    const stakingClient = await StakingClient.build(signer);

    // TODO: Slash account
    return;
    await stakingClient.slash(
      data.slasher,
      data.staker,
      data.escrowAddress,
      BigInt(ethers.parseUnits(data.amount.toString(), 'ether')),
    );
  }

  async processSlackInteraction(data: SlackInteraction): Promise<string> {
    const abuseId = Number(
      isViewSubmission(data) ? data.view.callback_id : data.callback_id,
    );

    if (!abuseId) {
      this.logger.error(
        'Callback ID is missing from the Slack interaction data:',
        data,
      );
      throw new Error(
        'Callback ID is missing from the Slack interaction data.',
      );
    }

    const abuseEntity = await this.abuseRepository.findOneById(abuseId);
    if (!abuseEntity) {
      this.logger.error('Abuse entity not found. Abuse id:', abuseId);
      throw new Error(`Abuse entity not found. Abuse id: ${abuseId}`);
    }

    if (
      isInteractiveMessage(data) &&
      data.actions[0].value === AbuseDecision.ACCEPTED
    ) {
      const escrow = await EscrowUtils.getEscrow(
        abuseEntity.chainId,
        abuseEntity.escrowAddress,
      );
      const maxAmount = Number(
        (await OperatorUtils.getOperator(abuseEntity.chainId, escrow.launcher))
          .amountStaked,
      );
      await this.abuseSlackBot.triggerAbuseReportModal({
        abuseId: abuseEntity.id,
        escrowAddress: abuseEntity.escrowAddress,
        chainId: abuseEntity.chainId,
        maxAmount: maxAmount,
        triggerId: data.trigger_id,
        responseUrl: data.response_url,
      });
      return '';
    } else if (isViewSubmission(data)) {
      const privateMetadata = JSON.parse(data.view.private_metadata);
      const responseUrl = privateMetadata.responseUrl;
      abuseEntity.decision = AbuseDecision.ACCEPTED;
      abuseEntity.amount = data.view.state.values.quantity_input.quantity.value;
      abuseEntity.retriesCount = 0;

      await this.abuseSlackBot.updateMessage(
        responseUrl,
        `Abuse ${abuseEntity.decision.toLowerCase()}. Escrow: ${abuseEntity.escrowAddress}, ChainId: ${abuseEntity.chainId}, Slashed amount: ${abuseEntity.amount} HMT`,
      );
      await this.abuseRepository.updateOne(abuseEntity);
      return '';
    } else {
      abuseEntity.decision = data.actions[0].value as AbuseDecision;
      abuseEntity.retriesCount = 0;
      await this.abuseRepository.updateOne(abuseEntity);
      return `Abuse ${abuseEntity.decision.toLowerCase()}. Escrow: ${abuseEntity.escrowAddress}, ChainId: ${abuseEntity.chainId}`;
    }
  }

  /**
   * Handles errors that occur during abuse processing.
   * It logs the error and, based on retry count, updates the abuse status accordingly.
   * @param abuseEntity - The entity representing the abuse data.
   * @param error - The error object thrown during processing.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  private async handleAbuseError(abuseEntity: AbuseEntity): Promise<void> {
    if (abuseEntity.retriesCount >= this.serverConfigService.maxRetryCount) {
      abuseEntity.status = AbuseStatus.FAILED;
    } else {
      abuseEntity.waitUntil = new Date();
      abuseEntity.retriesCount = abuseEntity.retriesCount + 1;
    }

    await this.abuseRepository.updateOne(abuseEntity);
  }

  async processAbuseRequests(): Promise<void> {
    const abuseEntities = await this.abuseRepository.findToClassify(
      AbuseStatus.PENDING,
    );

    for (const abuseEntity of abuseEntities) {
      try {
        const escrow = await EscrowUtils.getEscrow(
          abuseEntity.chainId,
          abuseEntity.escrowAddress,
        );
        const webhookUrl = (
          await OperatorUtils.getOperator(
            abuseEntity.chainId,
            escrow.exchangeOracle as string,
          )
        ).webhookUrl as string;

        const webhookPayload = {
          chainId: abuseEntity.chainId,
          escrowAddress: abuseEntity.escrowAddress,
          eventType: EventType.ABUSE_DETECTED,
        };

        try {
          await this.webhookOutgoingService.createOutgoingWebhook(
            webhookPayload,
            webhookUrl,
          );
        } catch (error) {
          if (!isDuplicatedError(error)) {
            this.logger.error('Failed to create outgoing webhook for oracle', {
              error,
              abuseEntityId: abuseEntity.id,
            });

            await this.handleAbuseError(abuseEntity);
            continue;
          }
        }

        await this.abuseSlackBot.sendAbuseNotification({
          abuseId: abuseEntity.id,
          chainId: abuseEntity.chainId,
          escrowAddress: abuseEntity.escrowAddress,
          manifestUrl: escrow.manifestUrl as string,
        });
        abuseEntity.status = AbuseStatus.NOTIFIED;
        await this.abuseRepository.updateOne(abuseEntity);
      } catch (err) {
        this.logger.error(`Error sending abuse: ${err.message}`);
        await this.handleAbuseError(abuseEntity);
      }
    }
  }

  async processClassifiedAbuses(): Promise<void> {
    const abuseEntities = await this.abuseRepository.findClassified({
      relations: { user: true },
    });

    for (const abuseEntity of abuseEntities) {
      try {
        const { chainId, escrowAddress } = abuseEntity;
        const escrow = await EscrowUtils.getEscrow(
          abuseEntity.chainId,
          abuseEntity.escrowAddress,
        );

        if (abuseEntity.decision === AbuseDecision.ACCEPTED) {
          await this.slashAccount({
            slasher: abuseEntity?.user?.evmAddress as string,
            staker: escrow.launcher,
            chainId: abuseEntity.chainId,
            escrowAddress: abuseEntity.escrowAddress,
            amount: Number(abuseEntity.amount),
          });
          const webhookUrl = (
            await OperatorUtils.getOperator(chainId, escrow.launcher)
          ).webhookUrl as string;
          const webhookPayload = {
            chainId,
            escrowAddress,
            eventType: EventType.ABUSE_DETECTED,
          };

          try {
            await this.webhookOutgoingService.createOutgoingWebhook(
              webhookPayload,
              webhookUrl,
            );
          } catch (error) {
            if (!isDuplicatedError(error)) {
              this.logger.error(
                'Failed to create outgoing webhook for oracle',
                {
                  error,
                  abuseEntityId: abuseEntity.id,
                },
              );

              await this.handleAbuseError(abuseEntity);
              continue;
            }
          }
        } else {
          await this.reputationService.decreaseReputation(
            chainId,
            abuseEntity.user?.evmAddress as string,
            ReputationEntityType.WORKER,
          );
          const webhookPayload = {
            chainId: chainId,
            escrowAddress: escrowAddress,
            eventType: EventType.ABUSE_DISMISSED,
          };
          const webhookUrl = (
            await OperatorUtils.getOperator(
              chainId,
              escrow.exchangeOracle as string,
            )
          ).webhookUrl as string;

          try {
            await this.webhookOutgoingService.createOutgoingWebhook(
              webhookPayload,
              webhookUrl,
            );
          } catch (error) {
            if (!isDuplicatedError(error)) {
              this.logger.error(
                'Failed to create outgoing webhook for oracle',
                {
                  error,
                  abuseEntityId: abuseEntity.id,
                },
              );

              await this.handleAbuseError(abuseEntity);
              continue;
            }
          }
        }
        abuseEntity.status = AbuseStatus.COMPLETED;
        await this.abuseRepository.updateOne(abuseEntity);
      } catch (err) {
        this.logger.error(`Error sending abuse: ${err.message}`);
        await this.handleAbuseError(abuseEntity);
      }
    }
  }
}
