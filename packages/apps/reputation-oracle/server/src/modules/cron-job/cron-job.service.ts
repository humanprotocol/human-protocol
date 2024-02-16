import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookStatus } from '../../common/enums/webhook';
import { WebhookRepository } from '../webhook/webhook.repository';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient } from '@human-protocol/sdk';

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
   * @throws {BadRequestException} if the cron job is already completed.
   */
  public async completeCronJob(
    cronJobEntity: CronJobEntity,
  ): Promise<CronJobEntity> {
    if (cronJobEntity.completedAt) {
      this.logger.error(ErrorCronJob.Completed, CronJobService.name);
      throw new BadRequestException(ErrorCronJob.Completed);
    }

    cronJobEntity.completedAt = new Date();
    return this.cronJobRepository.updateOne(cronJobEntity);
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
      const webhookEntities = await this.webhookRepository.findByStatus(
        WebhookStatus.PENDING,
      );

      for (const webhookEntity of webhookEntities) {
        let results;
        try {
          const { chainId, escrowAddress } = webhookEntity;
          results = await this.payoutService.executePayouts(
            chainId,
            escrowAddress,
          );
        } catch (err) {
          this.logger.error(`Error sending webhook: ${err.message}`);
          await this.webhookService.handleWebhookError(webhookEntity);
          continue;
        }
        webhookEntity.status = WebhookStatus.PAID;
        webhookEntity.resultsUrl = results.url;
        webhookEntity.checkPassed = results.checkPassed;
        webhookEntity.retriesCount = 0;
        await this.webhookRepository.updateOne(webhookEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Pending webhooks STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Process a paid webhook job.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
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
      const webhookEntities = await this.webhookRepository.findByStatus(
        WebhookStatus.PAID,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress, checkPassed } = webhookEntity;

          await this.reputationService.doAssessReputationScores(
            chainId,
            escrowAddress,
            checkPassed,
          );

          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });
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

    this.logger.log('Paid webhooks STOP');
    await this.completeCronJob(cronJob);
  }
}
