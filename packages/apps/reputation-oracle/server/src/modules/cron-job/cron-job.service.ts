import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import logger from '../../logger';

import { AbuseService } from '../abuse';
import { EscrowCompletionService } from '../escrow-completion';
import { IncomingWebhookService, OutgoingWebhookService } from '../webhook';

import { CronJobType } from './constants';
import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';

@Injectable()
export class CronJobService {
  private readonly logger = logger.child({ context: CronJobService.name });

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly incomingWebhookService: IncomingWebhookService,
    private readonly outgoingWebhookService: OutgoingWebhookService,
    private readonly escrowCompletionService: EscrowCompletionService,
    private readonly abuseService: AbuseService,
  ) {}

  /**
   * Starts a new cron job of the specified type if it's not already running.
   * If a cron job of the specified type doesn't exist, creates a new one and returns it.
   * If the cron job already exists, updates its start time and clears the completion time.
   */
  async startCronJob(cronJobType: CronJobType): Promise<CronJobEntity> {
    const cronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!cronJob) {
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();
      return this.cronJobRepository.createUnique(cronJobEntity);
    }

    cronJob.startedAt = new Date();
    cronJob.completedAt = null;

    return this.cronJobRepository.updateOne(cronJob);
  }

  async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!lastCronJob || lastCronJob.completedAt) {
      return false;
    }

    this.logger.info('Previous cron job is not completed yet', { cronJobType });

    return true;
  }

  async completeCronJob(cronJobEntity: CronJobEntity): Promise<CronJobEntity> {
    cronJobEntity.completedAt = new Date();
    return this.cronJobRepository.updateOne(cronJobEntity);
  }

  @Cron('*/2 * * * *')
  async processPendingIncomingWebhooks(): Promise<void> {
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
      await this.incomingWebhookService.processPendingIncomingWebhooks();
    } catch (error) {
      this.logger.error('Error processing pending incoming webhooks', error);
    }

    this.logger.info('Pending incoming webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processPendingEscrowCompletion(): Promise<void> {
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
      await this.escrowCompletionService.processPendingRecords();
    } catch (error) {
      this.logger.error('Error processing pending escrow completion', error);
    }

    this.logger.info('Pending escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processPaidEscrowCompletion(): Promise<void> {
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
      await this.escrowCompletionService.processPaidEscrows();
    } catch (error) {
      this.logger.error('Error processing paid escrow completion', error);
    }

    this.logger.info('Paid escrow completion tracking STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processPendingOutgoingWebhooks(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessPendingOutgoingWebhook,
    );
    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Pending outgoing webhooks START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessPendingOutgoingWebhook,
    );

    try {
      await this.outgoingWebhookService.processPendingOutgoingWebhooks();
    } catch (error) {
      this.logger.error('Error processing pending outgoing webhooks', error);
    }

    this.logger.info('Pending outgoing webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processAwaitingEscrowPayouts(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessAwaitingEscrowPayouts,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Awaiting payouts processing START');
    const cronJob = await this.startCronJob(
      CronJobType.ProcessAwaitingEscrowPayouts,
    );

    try {
      await this.escrowCompletionService.processAwaitingPayouts();
    } catch (error) {
      this.logger.error('Error processing awaiting payouts', error);
    }

    this.logger.info('Awaiting payouts processing STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processAbuseRequests(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessRequestedAbuse,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Process Abuse START');
    const cronJob = await this.startCronJob(CronJobType.ProcessRequestedAbuse);

    try {
      await this.abuseService.processAbuseRequests();
    } catch (e) {
      this.logger.error('Error processing abuse requests', e);
    }

    this.logger.info('Process Abuse STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  async processClassifiedAbuses(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessClassifiedAbuse,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.info('Process classified abuses START');
    const cronJob = await this.startCronJob(CronJobType.ProcessClassifiedAbuse);

    try {
      await this.abuseService.processClassifiedAbuses();
    } catch (e) {
      this.logger.error('Error processing classified abuse requests', e);
    }

    this.logger.info('Process classified abuses STOP');
    await this.completeCronJob(cronJob);
  }
}
