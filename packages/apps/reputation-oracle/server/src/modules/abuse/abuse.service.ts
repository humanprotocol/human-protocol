import {
  ChainId,
  EscrowUtils,
  OperatorUtils,
  StakingClient,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { ServerConfigService } from '@/config';
import { isDuplicatedError } from '@/database';
import logger from '@/logger';
import { Web3Service } from '@/modules/web3';
import {
  OutgoingWebhookEventType,
  OutgoingWebhookService,
} from '@/modules/webhook';

import { AbuseSlackBot } from './abuse-slack-bot';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { AbuseDecision, AbuseStatus } from './constants';
import {
  AbuseReportModalPrivateMetadata,
  isInteractiveMessage,
  isViewSubmission,
  ReportAbuseInput,
  SlackInteraction,
} from './types';

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
    private readonly outgoingWebhookService: OutgoingWebhookService,
  ) {}

  async reportAbuse(data: ReportAbuseInput): Promise<void> {
    const abuseEntity = new AbuseEntity();
    abuseEntity.escrowAddress = data.escrowAddress;
    abuseEntity.chainId = data.chainId;
    abuseEntity.userId = data.userId;
    abuseEntity.reason = data.reason;
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
      BigInt(ethers.parseUnits(data.amount.toString(), 18)),
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
      if (!escrow) {
        this.logger.error('Escrow data not found', { abuseId });
        throw new Error(`Escrow data is missing. Abuse id: ${abuseId}`);
      }
      const operator = await OperatorUtils.getOperator(
        abuseEntity.chainId,
        escrow.launcher,
      );
      if (!operator) {
        this.logger.error('Operator data not found', { abuseId });
        throw new Error(`Operator data is missing. Abuse id: ${abuseId}`);
      }
      await this.abuseSlackBot.triggerAbuseReportModal({
        abuseId: abuseEntity.id,
        escrowAddress: abuseEntity.escrowAddress,
        chainId: abuseEntity.chainId,
        maxAmount: Number(operator.stakedAmount),
        triggerId: data.trigger_id,
        responseUrl: data.response_url,
      });
      return '';
    } else if (isViewSubmission(data)) {
      const privateMetadata = JSON.parse(
        data.view.private_metadata,
      ) as AbuseReportModalPrivateMetadata;

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
    const abuseEntities = await this.abuseRepository.findToClassify();

    for (const abuseEntity of abuseEntities) {
      try {
        const escrow = await EscrowUtils.getEscrow(
          abuseEntity.chainId,
          abuseEntity.escrowAddress,
        );
        if (!escrow) {
          throw new Error('Escrow data is missing');
        }
        const operator = await OperatorUtils.getOperator(
          abuseEntity.chainId,
          escrow.exchangeOracle as string,
        );
        if (!operator) {
          throw new Error('Operator data is missing');
        }
        if (!operator.webhookUrl) {
          throw new Error('Operator webhook URL is missing');
        }

        const webhookPayload = {
          chainId: abuseEntity.chainId,
          escrowAddress: abuseEntity.escrowAddress,
          eventType: OutgoingWebhookEventType.ABUSE_DETECTED,
        };

        try {
          await this.outgoingWebhookService.createOutgoingWebhook(
            webhookPayload,
            operator.webhookUrl,
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
          manifestUrl: escrow.manifest as string,
        });
        abuseEntity.status = AbuseStatus.NOTIFIED;
        await this.abuseRepository.updateOne(abuseEntity);
      } catch (err) {
        this.logger.error(`Error sending abuse`, {
          error: err,
          abuseId: abuseEntity.id,
        });
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
        if (!escrow) {
          throw new Error('Escrow data is missing');
        }

        if (abuseEntity.decision === AbuseDecision.ACCEPTED) {
          await this.slashAccount({
            slasher: abuseEntity?.user?.evmAddress as string,
            staker: escrow.launcher,
            chainId: chainId,
            escrowAddress: escrowAddress,
            amount: Number(abuseEntity.amount),
          });
          const operator = await OperatorUtils.getOperator(
            chainId,
            escrow.launcher,
          );
          if (!operator) {
            throw new Error('Operator data is missing');
          }
          if (!operator.webhookUrl) {
            throw new Error('Operator webhook URL is missing');
          }

          const webhookPayload = {
            chainId,
            escrowAddress,
            eventType: OutgoingWebhookEventType.ABUSE_DETECTED,
          };

          try {
            await this.outgoingWebhookService.createOutgoingWebhook(
              webhookPayload,
              operator.webhookUrl,
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
          const webhookPayload = {
            chainId: chainId,
            escrowAddress: escrowAddress,
            eventType: OutgoingWebhookEventType.ABUSE_DISMISSED,
          };
          const operator = await OperatorUtils.getOperator(
            chainId,
            escrow.exchangeOracle as string,
          );
          if (!operator) {
            throw new Error('Operator data is missing');
          }
          if (!operator.webhookUrl) {
            throw new Error('Operator webhook URL is missing');
          }

          try {
            await this.outgoingWebhookService.createOutgoingWebhook(
              webhookPayload,
              operator.webhookUrl,
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
      } catch (error) {
        this.logger.error('Error sending abuse', {
          error: error,
          abuseId: abuseEntity.id,
        });
        await this.handleAbuseError(abuseEntity);
      }
    }
  }
}
