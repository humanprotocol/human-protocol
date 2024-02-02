import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobService } from '../job/job.service';
import { JobRequestType, JobStatus } from '../../common/enums/job';
import { WebhookService } from '../webhook/webhook.service';
import { StorageService } from '../storage/storage.service';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import { CvatManifestDto, FortuneManifestDto } from '../job/job.dto';
import { PaymentService } from '../payment/payment.service';
import { ethers } from 'ethers';
import { JobRepository } from '../job/job.repository';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly jobService: JobService,
    private readonly jobRepository: JobRepository,
    private readonly webhookService: WebhookService,
    private readonly storageService: StorageService,
    private readonly paymentService: PaymentService,
  ) {}

  public async startCronJob(cronJobType: CronJobType): Promise<CronJobEntity> {
    let cronJob = await this.cronJobRepository.findOne({
      cronJobType,
    });

    if (!cronJob) {
      cronJob = await this.cronJobRepository.create(cronJobType);
    } else {
      cronJob.startedAt = new Date();
      cronJob.completedAt = null;
      await cronJob.save();
    }

    return cronJob;
  }

  public async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOne({
      cronJobType,
    });

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
      this.logger.error(ErrorCronJob.Completed, CronJobService.name);
      throw new BadRequestException(ErrorCronJob.Completed);
    }

    cronJobEntity.completedAt = new Date();
    return cronJobEntity.save();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
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
          this.logger.error(`Error creating escrow: ${err.message}`);
          await this.jobService.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Create escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
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
          this.logger.error(`Error setting up escrow: ${err.message}`);
          await this.jobService.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Setup escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
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

          const manifest = await this.storageService.download(
            jobEntity.manifestUrl,
          );

          if ((manifest as CvatManifestDto)?.annotation?.type) {
            await this.webhookService.createWebhook({
              escrowAddress: jobEntity.escrowAddress,
              chainId: jobEntity.chainId,
              eventType: EventType.ESCROW_CREATED,
              oracleType: OracleType.CVAT,
              hasSignature: false,
            });
          }
        } catch (err) {
          this.logger.error(`Error funding escrow: ${err.message}`);
          await this.jobService.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Fund escrow STOP');
    await this.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
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
          await jobEntity.save();

          const manifest = await this.storageService.download(
            jobEntity.manifestUrl,
          );

          const oracleType = this.jobService.getOracleType(manifest);
          if (oracleType !== OracleType.HCAPTCHA) {
            await this.webhookService.createWebhook({
              escrowAddress: jobEntity.escrowAddress,
              chainId: jobEntity.chainId,
              eventType: EventType.ESCROW_CANCELED,
              oracleType: this.jobService.getOracleType(manifest),
              hasSignature:
                (manifest as FortuneManifestDto).requestType ===
                JobRequestType.FORTUNE,
            });
          }
        } catch (err) {
          this.logger.error(`Error canceling escrow: ${err.message}`);
          await this.jobService.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
    await this.completeCronJob(cronJob);
    this.logger.log('Cancel jobs STOP');
    return true;
  }

  /**
   * Process a pending webhook job.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
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
      const webhookEntities = await this.webhookService.findWebhookByStatus(
        WebhookStatus.PENDING,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          await this.webhookService.sendWebhook(webhookEntity);
          await this.webhookService.updateWebhookStatus(
            webhookEntity.id,
            WebhookStatus.COMPLETED,
          );
        } catch (err) {
          this.logger.error(`Error sending webhook: ${err.message}`);
          await this.webhookService.handleWebhookError(webhookEntity, err);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending webhooks STOP');
    await this.completeCronJob(cronJob);
  }
}
