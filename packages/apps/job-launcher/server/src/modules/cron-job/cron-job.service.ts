import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob, ErrorEscrow } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { JobService } from '../job/job.service';
import { JobStatus } from '../../common/enums/job';
import { WebhookService } from '../webhook/webhook.service';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import { PaymentService } from '../payment/payment.service';
import { ethers } from 'ethers';
import { WebhookRepository } from '../webhook/webhook.repository';
import { WebhookEntity } from '../webhook/webhook.entity';
import { JobRepository } from '../job/job.repository';
import { ControlledError } from '../../common/errors/controlled';
import { Cron } from '@nestjs/schedule';
import { EscrowStatus, EscrowUtils } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { JobEntity } from '../job/job.entity';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly jobService: JobService,
    private readonly jobRepository: JobRepository,
    private readonly webhookService: WebhookService,
    private readonly web3Service: Web3Service,
    private readonly paymentService: PaymentService,
    private readonly webhookRepository: WebhookRepository,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

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

  public async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!lastCronJob || lastCronJob.completedAt) {
      return false;
    }

    this.logger.log('Previous cron job is not completed yet');
    return true;
  }

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
  public async createEscrowCronJob() {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.CreateEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Create escrow START');
    const cronJob = await this.startCronJob(CronJobType.CreateEscrow);

    try {
      const jobEntities = await this.jobRepository.findByStatus(JobStatus.PAID);
      for (const jobEntity of jobEntities) {
        try {
          await this.jobService.createEscrow(jobEntity);
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorEscrow.NotCreated} (Error ID: ${errorId})`;
          this.logger.error(
            `Error creating escrow. Error ID: ${errorId}, Job ID: ${jobEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.jobService.handleProcessJobFailure(
            jobEntity,
            failedReason,
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Create escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('1-59/2 * * * *')
  public async setupEscrowCronJob() {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.SetupEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Setup escrow START');
    const cronJob = await this.startCronJob(CronJobType.SetupEscrow);

    try {
      const jobEntities = await this.jobRepository.findByStatus(
        JobStatus.CREATED,
      );

      for (const jobEntity of jobEntities) {
        try {
          await this.jobService.setupEscrow(jobEntity);
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorEscrow.NotSetup} (Error ID: ${errorId})`;
          this.logger.error(
            `Error setting up escrow. Error ID: ${errorId}, Job ID: ${jobEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.jobService.handleProcessJobFailure(
            jobEntity,
            failedReason,
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Setup escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  public async fundEscrowCronJob() {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.FundEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Fund escrow START');
    const cronJob = await this.startCronJob(CronJobType.FundEscrow);

    try {
      const jobEntities = await this.jobRepository.findByStatus(
        JobStatus.SET_UP,
      );

      for (const jobEntity of jobEntities) {
        try {
          await this.jobService.fundEscrow(jobEntity);
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorEscrow.NotFunded} (Error ID: ${errorId})`;
          this.logger.error(
            `Error funding escrow. Error ID: ${errorId}, Job ID: ${jobEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.jobService.handleProcessJobFailure(
            jobEntity,
            failedReason,
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Fund escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('*/2 * * * *')
  public async cancelCronJob() {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.CancelEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Cancel jobs START');
    const cronJob = await this.startCronJob(CronJobType.CancelEscrow);

    try {
      const jobEntities = await this.jobRepository.findByStatus(
        JobStatus.TO_CANCEL,
      );

      for (const jobEntity of jobEntities) {
        try {
          if (jobEntity.escrowAddress) {
            const { amountRefunded } =
              await this.jobService.processEscrowCancellation(jobEntity);
            await this.paymentService.createRefundPayment({
              refundAmount: Number(ethers.formatEther(amountRefunded)),
              userId: jobEntity.userId,
              jobId: jobEntity.id,
            });
          } else {
            await this.paymentService.createRefundPayment({
              refundAmount: jobEntity.fundAmount,
              userId: jobEntity.userId,
              jobId: jobEntity.id,
            });
          }
          jobEntity.status = JobStatus.CANCELED;
          await this.jobRepository.updateOne(jobEntity);

          const oracleType = this.jobService.getOracleType(
            jobEntity.requestType,
          );
          if (oracleType !== OracleType.HCAPTCHA) {
            const webhookEntity = new WebhookEntity();
            Object.assign(webhookEntity, {
              escrowAddress: jobEntity.escrowAddress,
              chainId: jobEntity.chainId,
              eventType: EventType.ESCROW_CANCELED,
              oracleType,
              hasSignature: true,
            });
            await this.webhookRepository.createUnique(webhookEntity);
          }
        } catch (err) {
          const errorId = uuidv4();
          const failedReason = `${ErrorEscrow.NotCanceled} (Error ID: ${errorId})`;
          this.logger.error(
            `Error canceling escrow. Error ID: ${errorId}, Job ID: ${jobEntity.id}, Reason: ${failedReason}, Message: ${err.message}`,
          );
          await this.jobService.handleProcessJobFailure(
            jobEntity,
            failedReason,
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
    await this.completeCronJob(cronJob);
    this.logger.log('Cancel jobs STOP');
    return true;
  }

  @Cron('*/5 * * * *')
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
      const webhookEntities = await this.webhookRepository.findByStatus(
        WebhookStatus.PENDING,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          await this.webhookService.sendWebhook(webhookEntity);
        } catch (err) {
          this.logger.error(`Error sending webhook: ${err.message}`);
          await this.webhookService.handleWebhookError(webhookEntity);
          continue;
        }
        webhookEntity.status = WebhookStatus.COMPLETED;
        await this.webhookRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron('30 */2 * * * *')
  /**
   * Process a job that syncs job statuses.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async syncJobStuses(): Promise<void> {
    const lastCronJob = await this.cronJobRepository.findOneByType(
      CronJobType.SyncJobStatuses,
    );

    if (lastCronJob && !lastCronJob.completedAt) {
      return;
    }

    this.logger.log('Update jobs START');
    const cronJob = await this.startCronJob(CronJobType.SyncJobStatuses);

    try {
      const events = await EscrowUtils.getStatusEvents(
        this.networkConfigService.networks.map((network) => network.chainId),
        [EscrowStatus.Partial, EscrowStatus.Complete],
        lastCronJob?.lastSubgraphTime || undefined,
        undefined,
        this.web3Service.getOperatorAddress(),
      );

      if (events.length === 0) {
        this.logger.log('No events to process');
        await this.completeCronJob(cronJob);
        return;
      }

      const escrowAddresses = events.map((event) =>
        ethers.getAddress(event.escrowAddress),
      );
      const chainIds = events.map((event) => event.chainId);

      const jobs =
        await this.jobRepository.findManyByChainIdsAndEscrowAddresses(
          chainIds,
          escrowAddresses,
        );

      const jobMap = new Map<string, JobEntity>();
      for (const job of jobs) {
        jobMap.set(`${job.chainId}-${job.escrowAddress}`, job);
      }

      const jobsToUpdate: JobEntity[] = [];
      let latestEventTimestamp = 0;

      for (const event of events) {
        const key = `${event.chainId}-${ethers.getAddress(event.escrowAddress)}`;
        const job = jobMap.get(key);

        if (!job || job.status === JobStatus.TO_CANCEL) continue;

        let newStatus: JobStatus | null = null;
        if (
          event.status === EscrowStatus[EscrowStatus.Partial] &&
          job.status !== JobStatus.PARTIAL
        ) {
          newStatus = JobStatus.PARTIAL;
        } else if (
          event.status === EscrowStatus[EscrowStatus.Complete] &&
          job.status !== JobStatus.COMPLETED
        ) {
          newStatus = JobStatus.COMPLETED;
        }

        if (newStatus && newStatus !== job.status) {
          job.status = newStatus;
          jobsToUpdate.push(job);
        }
        const eventTimestamp = new Date(event.timestamp * 1000).getTime();
        if (eventTimestamp > latestEventTimestamp) {
          latestEventTimestamp = eventTimestamp;
        }
      }

      if (jobsToUpdate.length > 0) {
        await this.jobRepository.updateMany(jobsToUpdate);
      }

      if (latestEventTimestamp > 0) {
        cronJob.lastSubgraphTime = new Date(latestEventTimestamp + 1000); // Add one sec to avoid getting the last processed event
        await this.cronJobRepository.save(cronJob);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Update jobs STOP');
    await this.completeCronJob(cronJob);
  }
}
