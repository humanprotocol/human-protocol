import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob, ErrorWebhook } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { WebhookService } from '../webhook/webhook.service';
import {
  EscrowCompletionTrackingStatus,
  EventType,
  WebhookIncomingStatus,
  WebhookOutgoingStatus,
} from '../../common/enums/webhook';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient, EscrowStatus, OperatorUtils } from '@human-protocol/sdk';
import { ControlledError } from '../../common/errors/controlled';
import { Cron } from '@nestjs/schedule';
import { WebhookIncomingRepository } from '../webhook/webhook-incoming.repository';
import { WebhookOutgoingRepository } from '../webhook/webhook-outgoing.repository';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly webhookService: WebhookService,
    private readonly escrowCompletionTrackingService: EscrowCompletionTrackingService,
    private readonly reputationService: ReputationService,
    private readonly webhookIncomingRepository: WebhookIncomingRepository,
    private readonly webhookOutgoingRepository: WebhookOutgoingRepository,
    private readonly escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
    private readonly payoutService: PayoutService,
    private readonly web3Service: Web3Service,
  ) {}

  /**
   * Starts a new cron job of the specified type if it's not already running.
   * If a cron job of the specified type doesn't exist, creates a new one and returns it.
   * If the cron job already exists, updates its start time and clears the completion time.
   * @param cronJobType The type of cron job to start.
   * @returns {Promise<CronJobEntity>} A Promise containing the started or updated cron job entity.
   */
  public async startCronJob(cronJobType: CronJobType): Promise<CronJobEntity> {
    const cronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!cronJob) {
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      return this.cronJobRepository.createUnique(cronJobEntity);
    }
    cronJob.startedAt = new Date();
    cronJob.completedAt = null;
    return this.cronJobRepository.updateOne(cronJob);
  }

  /**
   * Checks if a cron job of the specified type is currently running.
   * @param cronJobType The type of cron job to check.
   * @returns {Promise<boolean>} A Promise indicating whether the cron job is running.
   */
  public async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!lastCronJob || lastCronJob.completedAt) {
      return false;
    }

    this.logger.log('Previous cron job is not completed yet');
    return true;
  }

  /**
   * Marks the specified cron job entity as completed.
   * Throws an error if the cron job entity is already marked as completed.
   * @param cronJobEntity The cron job entity to mark as completed.
   * @returns {Promise<CronJobEntity>} A Promise containing the updated cron job entity.
   * @throws {ControlledError} if the cron job is already completed.
   */
  public async completeCronJob(
    cronJobEntity: CronJobEntity,
  ): Promise<CronJobEntity> {
    if (cronJobEntity.completedAt) {
      throw new ControlledError(ErrorCronJob.Completed, HttpStatus.BAD_REQUEST);
    }

    cronJobEntity.completedAt = new Date();
    return this.cronJobRepository.updateOne(cronJobEntity);
  }

  @Cron('*/2 * * * *')
  /**
   * Processes all pending incoming webhooks, marking them as completed upon success.
   * Handles any errors by logging them and updating the webhook status.
   * @returns {Promise<void>} A promise that resolves when all pending incoming webhooks have been processed.
   */
  public async processPendingIncomingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingIncomingWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Pending incoming webhooks START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingIncomingWebhook,
    );

    try {
      const webhookEntities = await this.webhookIncomingRepository.findByStatus(
        WebhookIncomingStatus.PENDING,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress } = webhookEntity;

          await this.escrowCompletionTrackingService.createEscrowCompletionTracking(
            chainId,
            escrowAddress,
          );

          webhookEntity.status = WebhookIncomingStatus.COMPLETED;
          await this.webhookIncomingRepository.updateOne(webhookEntity);
        } catch (err) {
          if (err instanceof DatabaseError) {
            if (
              (err as DatabaseError).message.includes(
                PostgresErrorCodes.Duplicated,
              )
            ) {
              this.logger.warn(
                `Duplicate tracking entity for escrowAddress: ${webhookEntity.escrowAddress}. Marking webhook as completed.`,
              );
              webhookEntity.status = WebhookIncomingStatus.COMPLETED;
              await this.webhookIncomingRepository.updateOne(webhookEntity);
            } else {
              const errorId = uuidv4();
              const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
              this.logger.error(
                `Database error for webhook processing. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
              );
              await this.webhookService.handleWebhookIncomingError(
                webhookEntity,
                failedReason,
              );
              continue;
            }
          } else {
            const errorId = uuidv4();
            const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
            this.logger.error(
              `Unexpected error processing webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
            );
            await this.webhookService.handleWebhookIncomingError(
              webhookEntity,
              failedReason,
            );
            continue;
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending incoming webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  /**
   * Processes pending escrow completion tracking webhooks to manage escrow lifecycle actions.
   * Checks escrow status and, if appropriate, saves results and initiates payouts.
   * Handles errors and logs detailed messages.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  public async processPendingEscrowCompletion(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingEscrowCompletionTracking,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Pending escrow completion tracking START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingEscrowCompletionTracking,
    );

    try {
      const escrowCompletionTrackingEntities =
        await this.escrowCompletionTrackingRepository.findByStatus(
          EscrowCompletionTrackingStatus.PENDING,
        );

      for (const escrowCompletionTrackingEntity of escrowCompletionTrackingEntities) {
        try {
          const { chainId, escrowAddress, finalResultsUrl, finalResultsHash } =
            escrowCompletionTrackingEntity;

          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          const escrowStatus = await escrowClient.getStatus(escrowAddress);
          if (escrowStatus === EscrowStatus.Launched) {
            if (!finalResultsUrl) {
              const { url, hash } = await this.payoutService.saveResults(
                chainId,
                escrowAddress,
              );

              escrowCompletionTrackingEntity.finalResultsUrl = url;
              escrowCompletionTrackingEntity.finalResultsHash = hash;
              await this.escrowCompletionTrackingRepository.updateOne(
                escrowCompletionTrackingEntity,
              );
            }

            await this.payoutService.executePayouts(
              chainId,
              escrowAddress,
              finalResultsUrl,
              finalResultsHash,
            );
          }

          escrowCompletionTrackingEntity.status =
            EscrowCompletionTrackingStatus.PAID;
          await this.escrowCompletionTrackingRepository.updateOne(
            escrowCompletionTrackingEntity,
          );
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
            escrowCompletionTrackingEntity,
            failedReason,
          );
          continue;
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  /**
   * Processes paid escrow completion tracking webhooks, finalizing escrow operations if completed.
   * Notifies oracles via callbacks, logs errors, and updates tracking status.
   * @returns {Promise<void>} A promise that resolves when the paid escrow tracking has been processed.
   */
  public async processPaidEscrowCompletion(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPaidEscrowCompletionTracking,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Paid escrow completion tracking START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPaidEscrowCompletionTracking,
    );

    try {
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
            // Temporarily disable sending webhook to Recording Oracle
            // (
            //   await OperatorUtils.getLeader(
            //     chainId,
            //     await escrowClient.getRecordingOracleAddress(escrowAddress),
            //   )
            // ).webhookUrl,
          ];

          let allWebhooksCreated = true;

          for (const url of callbackUrls) {
            if (!url) {
              throw new ControlledError(
                ErrorWebhook.UrlNotFound,
                HttpStatus.NOT_FOUND,
              );
            }

            const payload = {
              chainId,
              escrowAddress,
              eventType: EventType.ESCROW_COMPLETED,
            };

            const hash = crypto
              .createHash('sha1')
              .update(stringify({ payload, url }))
              .digest('hex');

            try {
              await this.webhookService.createOutgoingWebhook(
                payload,
                hash,
                url,
              );
            } catch (err) {
              if (
                err instanceof DatabaseError &&
                err.message.includes(PostgresErrorCodes.Duplicated)
              ) {
                this.logger.warn(
                  `Duplicate outgoing webhook for escrowAddress: ${escrowAddress}. Webhook creation skipped, but will not complete escrow until all URLs are successful.`,
                );
                continue;
              } else {
                const errorId = uuidv4();
                const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
                this.logger.error(
                  `Error creating outgoing webhook. Error ID: ${errorId}, Escrow Address: ${escrowAddress}, Reason: ${failedReason}, Message: ${err.message}`,
                );
                await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
                  escrowCompletionTrackingEntity,
                  failedReason,
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
          const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
            escrowCompletionTrackingEntity,
            failedReason,
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  /**
   * Processes pending outgoing webhooks, sending requests to designated URLs.
   * Updates each webhook's status upon success, retries or logs errors as necessary.
   * @returns {Promise<void>} A promise that resolves once all pending outgoing webhooks have been processed.
   */
  public async processPendingOutgoingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingOutgoingWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Pending outgoing webhooks START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingOutgoingWebhook,
    );

    try {
      const webhookEntities = await this.webhookOutgoingRepository.findByStatus(
        WebhookOutgoingStatus.PENDING,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { url, payload } = webhookEntity;

          await this.webhookService.sendWebhook(url, payload);
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing pending outgoing webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.webhookService.handleWebhookOutgoingError(
            webhookEntity,
            failedReason,
          );
          continue;
        }
        webhookEntity.status = WebhookOutgoingStatus.SENT;
        await this.webhookOutgoingRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending outgoing webhooks STOP');
    await this.completeCronJob(cronJob);
  }
}
