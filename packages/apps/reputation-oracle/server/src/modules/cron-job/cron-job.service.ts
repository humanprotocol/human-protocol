import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { CronJobType } from '../../common/enums/cron-job';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { WebhookIncomingService } from '../webhook/webhook-incoming.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { EscrowCompletionService } from '../escrow-completion/escrow-completion.service';
import logger from '../../logger';

@Injectable()
export class CronJobService {
  private readonly logger = logger.child({ context: CronJobService.name });

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly webhookIncomingService: WebhookIncomingService,
    private readonly webhookOutgoingService: WebhookOutgoingService,
    private readonly escrowCompletionService: EscrowCompletionService,
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

    this.logger.info('Previous cron job is not completed yet');
    return true;
  }

  /**
   * Marks the specified cron job entity as completed.
   * Throws an error if the cron job entity is already marked as completed.
   * @param cronJobEntity The cron job entity to mark as completed.
   * @returns {Promise<CronJobEntity>} A Promise containing the updated cron job entity.
   */
  public async completeCronJob(
    cronJobEntity: CronJobEntity,
  ): Promise<CronJobEntity> {
    if (cronJobEntity.completedAt) {
      throw new Error('Cron job is already completed');
    }

    cronJobEntity.completedAt = new Date();
    return this.cronJobRepository.updateOne(cronJobEntity);
  }

  /**
   * Processes all pending incoming webhooks, marking them as completed upon success.
   * Handles any errors by logging them and updating the webhook status.
   * @returns {Promise<void>} A promise that resolves when all pending incoming webhooks have been processed.
   */
  @Cron('*/2 * * * *')
  public async processPendingIncomingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingIncomingWebhook,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Pending incoming webhooks START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingIncomingWebhook,
    );

    try {
      await this.webhookIncomingService.processPendingIncomingWebhooks();
    } catch (error) {
      this.logger.error('Error processing pending incoming webhooks', error);
    }

    this.logger.info('Pending incoming webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Processes pending escrow completion tracking to manage escrow lifecycle actions.
   * Checks escrow status and, if appropriate, saves results and initiates payouts.
   * Handles errors and logs detailed messages.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Cron('*/2 * * * *')
  public async processPendingEscrowCompletion(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingEscrowCompletionTracking,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Pending escrow completion tracking START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingEscrowCompletionTracking,
    );

    try {
      await this.escrowCompletionService.processPendingEscrowCompletion();
    } catch (error) {
      this.logger.error('Error processing pending escrow completion', error);
    }

    this.logger.info('Pending escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Processes paid escrow completion tracking, finalizing escrow operations if completed.
   * Notifies oracles via callbacks, logs errors, and updates tracking status.
   * @returns {Promise<void>} A promise that resolves when the paid escrow tracking has been processed.
   */
  @Cron('*/2 * * * *')
  public async processPaidEscrowCompletion(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPaidEscrowCompletionTracking,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Paid escrow completion tracking START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPaidEscrowCompletionTracking,
    );

    try {
      await this.escrowCompletionService.processPaidEscrowCompletion();
    } catch (error) {
      this.logger.error('Error processing paid escrow completion', error);
    }

    this.logger.info('Paid escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Processes pending outgoing webhooks, sending requests to designated URLs.
   * Updates each webhook's status upon success, retries or logs errors as necessary.
   * @returns {Promise<void>} A promise that resolves once all pending outgoing webhooks have been processed.
   */
  @Cron('*/2 * * * *')
  public async processPendingOutgoingWebhooks(): Promise<void> {
    if (await this.isCronJobRunning(CronJobType.ProcessPendingOutgoingWebhook))
      return;

    this.logger.info('Pending outgoing webhooks START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingOutgoingWebhook,
    );

    try {
      await this.webhookOutgoingService.processPendingOutgoingWebhooks();
    } catch (error) {
      this.logger.error('Error processing pending outgoing webhooks', error);
    }

    this.logger.info('Pending outgoing webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Runs processing of awaiting payouts for escrow completion.
   * @returns {Promise<void>} A promise that resolves when the processing is finished.
   */
  @Cron('*/2 * * * *')
  public async processAwaitingEscrowPayouts(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessAwaitingEscrowPayouts,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Awaiting payouts escrow completion tracking START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessAwaitingEscrowPayouts,
    );

    try {
      await this.escrowCompletionService.processAwaitingPayouts();
    } catch (error) {
      this.logger.error('Error processing awaiting payouts', error);
    }

    this.logger.info('Awaiting payouts escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }
}
