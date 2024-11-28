/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { v4 as uuidv4 } from 'uuid';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EscrowCompletionTrackingStatus, EventType } from '../../common/enums';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  OperatorUtils,
} from '@human-protocol/sdk';
import { calculateExponentialBackoffMs } from '../../common/utils/backoff';
import { BACKOFF_INTERVAL_SECONDS } from '../../common/constants';
import { WebhookIncomingService } from '../webhook/webhook-incoming.service';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import {
  ErrorEscrowCompletionTracking,
  ErrorWebhook,
} from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { isDuplicatedError } from '../../common/utils/database';

@Injectable()
export class EscrowCompletionTrackingService {
  private readonly logger = new Logger(WebhookIncomingService.name);

  constructor(
    private readonly escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
    private readonly web3Service: Web3Service,
    private readonly webhookOutgoingService: WebhookOutgoingService,
    private readonly payoutService: PayoutService,
    private readonly reputationService: ReputationService,
    public readonly serverConfigService: ServerConfigService,
  ) {}

  /**
   * Creates a tracking record for escrow completion in the repository.
   * Sets initial status to 'PENDING'.
   * @param {ChainId} chainId - The blockchain chain ID.
   * @param {string} escrowAddress - The address of the escrow contract.
   */
  public async createEscrowCompletionTracking(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    let escrowCompletionTrackingEntity = new EscrowCompletionTrackingEntity();
    escrowCompletionTrackingEntity.chainId = chainId;
    escrowCompletionTrackingEntity.escrowAddress = escrowAddress;
    escrowCompletionTrackingEntity.status =
      EscrowCompletionTrackingStatus.PENDING;
    escrowCompletionTrackingEntity.waitUntil = new Date();
    escrowCompletionTrackingEntity.retriesCount = 0;

    escrowCompletionTrackingEntity =
      await this.escrowCompletionTrackingRepository.createUnique(
        escrowCompletionTrackingEntity,
      );
  }

  /**
   * Handles errors that occur during escrow completion tracking.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param escrowCompletionTrackingEntity - The escrow tracking entity.
   * @param failureDetail - Reason for the failure.
   */
  public async handleEscrowCompletionTrackingError(
    escrowCompletionTrackingEntity: EscrowCompletionTrackingEntity,
    failureDetail: string,
  ): Promise<void> {
    if (
      escrowCompletionTrackingEntity.retriesCount <
      this.serverConfigService.maxRetryCount
    ) {
      const exponentialBackoff = calculateExponentialBackoffMs(
        escrowCompletionTrackingEntity.retriesCount,
        BACKOFF_INTERVAL_SECONDS,
      );
      escrowCompletionTrackingEntity.waitUntil = new Date(
        Date.now() + exponentialBackoff,
      );
      escrowCompletionTrackingEntity.retriesCount += 1;
    } else {
      escrowCompletionTrackingEntity.failureDetail = failureDetail;
      escrowCompletionTrackingEntity.status =
        EscrowCompletionTrackingStatus.FAILED;
    }
    await this.escrowCompletionTrackingRepository.updateOne(
      escrowCompletionTrackingEntity,
    );
  }

  public async processPendingEscrowCompletion(): Promise<void> {
    const escrowCompletionTrackingEntities =
      await this.escrowCompletionTrackingRepository.findByStatus(
        EscrowCompletionTrackingStatus.PENDING,
      );

    for (const escrowCompletionTrackingEntity of escrowCompletionTrackingEntities) {
      try {
        const signer = this.web3Service.getSigner(
          escrowCompletionTrackingEntity.chainId,
        );
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(
          escrowCompletionTrackingEntity.escrowAddress,
        );
        if (escrowStatus === EscrowStatus.Pending) {
          if (!escrowCompletionTrackingEntity.finalResultsUrl) {
            const { url, hash } = await this.payoutService.processResults(
              escrowCompletionTrackingEntity.chainId,
              escrowCompletionTrackingEntity.escrowAddress,
            );

            escrowCompletionTrackingEntity.finalResultsUrl = url;
            escrowCompletionTrackingEntity.finalResultsHash = hash;
            await this.escrowCompletionTrackingRepository.updateOne(
              escrowCompletionTrackingEntity,
            );
          }

          await this.payoutService.executePayouts(
            escrowCompletionTrackingEntity.chainId,
            escrowCompletionTrackingEntity.escrowAddress,
            escrowCompletionTrackingEntity.finalResultsUrl,
            escrowCompletionTrackingEntity.finalResultsHash,
          );
        }

        escrowCompletionTrackingEntity.status =
          EscrowCompletionTrackingStatus.PAID;
        await this.escrowCompletionTrackingRepository.updateOne(
          escrowCompletionTrackingEntity,
        );
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorEscrowCompletionTracking.PendingProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
        );
        await this.handleEscrowCompletionTrackingError(
          escrowCompletionTrackingEntity,
          failureDetail,
        );
        continue;
      }
    }
  }

  public async processPaidEscrowCompletion(): Promise<void> {
    const escrowCompletionTrackingEntities =
      await this.escrowCompletionTrackingRepository.findByStatus(
        EscrowCompletionTrackingStatus.PAID,
      );

    // TODO: Add DB transactions
    for (const escrowCompletionTrackingEntity of escrowCompletionTrackingEntities) {
      try {
        const { chainId, escrowAddress } = escrowCompletionTrackingEntity;

        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(escrowAddress);
        if (escrowStatus === EscrowStatus.Paid) {
          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });

          // TODO: Technically it's possible that the escrow completion could occur before the reputation scores are assessed,
          // and the app might go down during this window. Currently, there isn’t a clear approach to handle this situation.
          // Consider revisiting this section to explore potential solutions to improve resilience in such scenarios.
          await this.reputationService.assessReputationScores(
            chainId,
            escrowAddress,
          );
        }

        const callbackUrls = [
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getJobLauncherAddress(escrowAddress),
            )
          ).webhookUrl,
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getExchangeOracleAddress(escrowAddress),
            )
          ).webhookUrl,
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getRecordingOracleAddress(escrowAddress),
            )
          ).webhookUrl,
        ];

        let allWebhooksCreated = true;

        const payload = {
          chainId,
          escrowAddress,
          eventType: EventType.ESCROW_COMPLETED,
        };

        for (const url of callbackUrls) {
          if (!url) {
            throw new ControlledError(
              ErrorWebhook.UrlNotFound,
              HttpStatus.NOT_FOUND,
            );
          }

          try {
            await this.webhookOutgoingService.createOutgoingWebhook(
              payload,
              url,
            );
          } catch (err) {
            if (isDuplicatedError(err)) {
              this.logger.warn(
                `Duplicate outgoing webhook for escrowAddress: ${escrowAddress}. Webhook creation skipped, but will not complete escrow until all URLs are successful.`,
              );
              continue;
            } else {
              const errorId = uuidv4();
              const failureDetail = `${ErrorEscrowCompletionTracking.PaidProcessingFailed} (Error ID: ${errorId})`;
              this.logger.error(
                `Error creating outgoing webhook. Error ID: ${errorId}, Escrow Address: ${escrowAddress}, Reason: ${failureDetail}, Message: ${err.message}`,
              );
              await this.handleEscrowCompletionTrackingError(
                escrowCompletionTrackingEntity,
                failureDetail,
              );
              allWebhooksCreated = false;
              break;
            }
          }
        }

        // Only set the status to COMPLETED if all webhooks were created successfully
        if (allWebhooksCreated) {
          escrowCompletionTrackingEntity.status =
            EscrowCompletionTrackingStatus.COMPLETED;
          await this.escrowCompletionTrackingRepository.updateOne(
            escrowCompletionTrackingEntity,
          );
        }
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorEscrowCompletionTracking.PaidProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
        );
        await this.handleEscrowCompletionTrackingError(
          escrowCompletionTrackingEntity,
          failureDetail,
        );
      }
    }
  }
}
