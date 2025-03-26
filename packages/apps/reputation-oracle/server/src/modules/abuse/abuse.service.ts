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
import { AbuseDecision, AbuseStatus } from '../../common/enums/abuse';
import { ServerConfigService } from '../../config/server-config.service';
import logger from '../../logger';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { ReportAbuseDto, AbuseResponseDto } from './abuse.dto';
import { AbuseEntity } from './abuse.entity';
import { AbuseError, AbuseErrorMessage } from './abuse.error';
import { AbuseRepository } from './abuse.repository';
import { SlackService } from '../slack/slack.service';

@Injectable()
export class AbuseService {
  private readonly logger = logger.child({
    context: AbuseService.name,
  });
  private localStorage: { [key: string]: string } = {};

  constructor(
    private readonly slackService: SlackService,
    private readonly abuseRepository: AbuseRepository,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
    private readonly reputationService: ReputationService,
    private readonly webhookOutgoingService: WebhookOutgoingService,
  ) {}

  async createAbuse(data: ReportAbuseDto, userId: number): Promise<void> {
    const abuseEntity = new AbuseEntity();
    abuseEntity.escrowAddress = data.escrowAddress;
    abuseEntity.chainId = data.chainId;
    abuseEntity.userId = userId;

    await this.abuseRepository.createUnique(abuseEntity);
    return;
  }

  private async sendSlackNotification(abuseEntity: AbuseEntity): Promise<void> {
    const escrow = await EscrowUtils.getEscrow(
      abuseEntity.chainId,
      abuseEntity.escrowAddress,
    );

    const message = {
      text: 'New abuse report received!',
      attachments: [
        {
          title: 'Escrow',
          fields: [
            { title: 'Address', value: abuseEntity.escrowAddress },
            { title: 'ChainId', value: abuseEntity.chainId },
            { title: 'Manifest', value: escrow.manifestUrl },
          ],
        },
        {
          fallback: 'Actions',
          title: 'Actions',
          callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [
            {
              name: 'accept',
              text: 'Slash',
              type: 'button',
              style: 'primary',
              value: AbuseDecision.ACCEPTED,
            },
            {
              name: 'reject',
              text: 'Reject',
              type: 'button',
              style: 'danger',
              value: AbuseDecision.REJECTED,
              confirm: {
                title: 'Cancel abuse',
                text: `Are you sure you want to cancel slash for escrow ${abuseEntity.escrowAddress}?`,
                ok_text: 'Yes',
                dismiss_text: 'No',
              },
            },
          ],
        },
      ],
    };

    await this.slackService.sendNotification(message);
  }

  private async sendAbuseReportModal(abuseEntity: any, triggerId: string) {
    const escrow = await EscrowUtils.getEscrow(
      abuseEntity.chainId,
      abuseEntity.escrowAddress,
    );
    const maxAmount = (
      await OperatorUtils.getOperator(abuseEntity.chainId, escrow.launcher)
    ).amountStaked;

    const modalView = {
      type: 'modal',
      callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
      title: { type: 'plain_text', text: 'Confirm slash' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Max amount: ${maxAmount}` },
        },
        {
          type: 'input',
          block_id: 'quantity_input',
          element: {
            action_id: 'quantity',
            type: 'number_input',
            is_decimal_allowed: true,
            min_value: '0',
            max_value: maxAmount,
          },
          label: {
            type: 'plain_text',
            text: 'Please enter the quantity (in HMT):',
          },
        },
      ],
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
    };

    await this.slackService.openModal(triggerId, modalView);
  }

  private async slashAccount(
    slasher: string,
    staker: string,
    chainId: ChainId,
    escrowAddress: string,
    amount: number,
  ) {
    const signer = this.web3Service.getSigner(chainId);
    const stakingClient = await StakingClient.build(signer);

    // TODO: Slash account
    return;
    await stakingClient.slash(
      slasher,
      staker,
      escrowAddress,
      BigInt(ethers.parseUnits(amount.toString(), 'ether')),
    );
  }

  async receiveInteractions(data: any): Promise<string> {
    const callback_id = data.callback_id
      ? data.callback_id
      : data.view.callback_id;
    const callbackId = (callback_id as string).split('-');
    const escrowAddress = callbackId[0];
    const chainId = Number(callbackId[1]);

    const abuseEntity =
      await this.abuseRepository.findOneByChainIdAndEscrowAddress(
        chainId,
        escrowAddress,
      );
    if (!abuseEntity)
      throw new AbuseError(
        AbuseErrorMessage.ABUSE_NOT_FOUND,
        escrowAddress,
        chainId,
      );

    if (
      data.type === 'interactive_message' &&
      data.actions[0].value === AbuseDecision.ACCEPTED
    ) {
      this.localStorage[callback_id] = data.response_url;
      await this.sendAbuseReportModal(abuseEntity, data.trigger_id);
      return '';
    } else if (data.type === 'view_submission') {
      abuseEntity.decision = AbuseDecision.ACCEPTED;
      abuseEntity.amount = data.view.state.values.quantity_input.quantity.value;
      abuseEntity.retriesCount = 0;
      await this.slackService.updateMessage(
        this.localStorage[callback_id],
        `Abuse ${(abuseEntity.decision as string).toLowerCase()}. Escrow: ${escrowAddress}, ChainId: ${chainId}, Slashed amount: ${abuseEntity.amount} HMT`,
      );
      await this.abuseRepository.updateOne(abuseEntity);
      return '';
    } else {
      abuseEntity.decision = data.actions[0].value;
      abuseEntity.retriesCount = 0;
      await this.abuseRepository.updateOne(abuseEntity);
      return `Abuse ${(abuseEntity.decision as string).toLowerCase()}. Escrow: ${escrowAddress}, ChainId: ${chainId}`;
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

    this.abuseRepository.updateOne(abuseEntity);
  }

  async processAbuseRequests(): Promise<void> {
    const abuseEntities = await this.abuseRepository.findByStatus(
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
          eventType: EventType.ABUSE_REPORTED,
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
        await this.sendSlackNotification(abuseEntity);
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
          this.slashAccount(
            abuseEntity.user.evmAddress as string,
            escrow.launcher,
            abuseEntity.chainId,
            abuseEntity.escrowAddress,
            abuseEntity.amount as number,
          );
          const webhookUrl = (
            await OperatorUtils.getOperator(chainId, escrow.launcher)
          ).webhookUrl as string;
          const webhookPayload = {
            chainId,
            escrowAddress,
            eventType: EventType.ABUSE_REPORTED,
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
            eventType: EventType.RESUME_REPORTED_ABUSE,
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

  async getAbuseReportsByUser(userId: number): Promise<AbuseResponseDto[]> {
    const abuseEntities = await this.abuseRepository.findByUserId(userId);
    return abuseEntities.map((abuseEntity) => {
      return {
        id: abuseEntity.id,
        escrowAddress: abuseEntity.escrowAddress,
        chainId: abuseEntity.chainId,
        status: abuseEntity.status,
      };
    });
  }
}
