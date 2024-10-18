import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob, ErrorWebhook } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { WebhookService } from '../webhook/webhook.service';
import {
  EventType,
  WebhookStatus,
  WebhookType,
} from '../../common/enums/webhook';
import { WebhookRepository } from '../webhook/webhook.repository';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient, EscrowStatus, OperatorUtils } from '@human-protocol/sdk';
import { SendWebhookDto, WebhookDto } from '../webhook/webhook.dto';
import { ControlledError } from '../../common/errors/controlled';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly webhookService: WebhookService,
    private readonly reputationService: ReputationService,
    private readonly webhookRepository: WebhookRepository,
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
   * Process a pending webhook job.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async processPendingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Pending webhooks START');
    const cronJob = await this.startCronJob(CronJobType.ProcessPendingWebhook);

    try {
      const webhookEntities = await this.webhookRepository.findByStatusAndType(
        WebhookStatus.PENDING,
        WebhookType.IN,
      );

      for (const webhookEntity of webhookEntities) {
        let resultsUrl;
        try {
          const { chainId, escrowAddress } = webhookEntity;
          resultsUrl = await this.payoutService.executePayouts(
            chainId,
            escrowAddress,
          );
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing pending webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.webhookService.handleWebhookError(
            webhookEntity,
            failedReason,
          );
          continue;
        }
        webhookEntity.status = WebhookStatus.PAID;
        webhookEntity.resultsUrl = resultsUrl;
        webhookEntity.retriesCount = 0;
        await this.webhookRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('1-59/2 * * * *')
  /**
   * Process a paid webhook job.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async processPaidWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPaidWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Paid webhooks START');
    const cronJob = await this.startCronJob(CronJobType.ProcessPaidWebhook);

    try {
      const webhookEntities = await this.webhookRepository.findByStatusAndType(
        WebhookStatus.PAID,
        WebhookType.IN,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress } = webhookEntity;

          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          const escrowStatus = await escrowClient.getStatus(escrowAddress);
          if (escrowStatus === EscrowStatus.Complete) {
            continue;
          }

          await this.reputationService.assessReputationScores(
            chainId,
            escrowAddress,
          );

          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });

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

          for (const callbackUrl of callbackUrls) {
            if (!callbackUrl) {
              throw new ControlledError(
                ErrorWebhook.CallbackUrlNotFound,
                HttpStatus.NOT_FOUND,
              );
            }

            const dto: WebhookDto = {
              chainId,
              escrowAddress,
              eventType: EventType.ESCROW_COMPLETED,
              type: WebhookType.OUT,
              callbackUrl,
            };

            this.webhookService.createWebhook(dto);
          }
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorWebhook.PaidProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing paid webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.webhookService.handleWebhookError(
            webhookEntity,
            failedReason,
          );
          continue;
        }
        webhookEntity.status = WebhookStatus.COMPLETED;

        await this.webhookRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Paid webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  /**
   * Process a pending webhook job with out type.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async processOutgoingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessOutgoingWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Pending webhooks with out type START');
    const cronJob = await this.startCronJob(CronJobType.ProcessOutgoingWebhook);

    try {
      const webhookEntities = await this.webhookRepository.findByStatusAndType(
        WebhookStatus.PENDING,
        WebhookType.OUT,
      );

      for (const webhookEntity of webhookEntities) {
        let resultsUrl;
        try {
          const { callbackUrl, chainId, escrowAddress } = webhookEntity;

          const body: SendWebhookDto = {
            chainId,
            escrowAddress,
            eventType: EventType.ESCROW_COMPLETED,
          };

          if (!callbackUrl) {
            throw new ControlledError(
              ErrorWebhook.CallbackUrlNotFound,
              HttpStatus.NOT_FOUND,
            );
          }

          await this.webhookService.sendWebhook(callbackUrl, body);
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Error processing pending webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.webhookService.handleWebhookError(
            webhookEntity,
            failedReason,
          );
          continue;
        }
        webhookEntity.status = WebhookStatus.PAID;
        webhookEntity.retriesCount = 0;
        await this.webhookRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending webhooks with out type STOP');
    await this.completeCronJob(cronJob);
  }
}
