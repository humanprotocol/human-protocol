import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob, ErrorWebhook } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { WebhookService } from '../webhook/webhook.service';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { WebhookRepository } from '../webhook/webhook.repository';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient, OperatorUtils } from '@human-protocol/sdk';
import { WebhookDto } from '../webhook/webhook.dto';
import { AbuseRepository } from '../abuse/abuse.repository';
import { AbuseService } from '../abuse/abuse.service';
import { AbuseDecision, AbuseStatus } from '../../common/enums/abuse';
import { ReputationEntityType } from '../../common/enums';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly webhookService: WebhookService,
    private readonly reputationService: ReputationService,
    private readonly webhookRepository: WebhookRepository,
    private readonly abuseRepository: AbuseRepository,
    private readonly abuseService: AbuseService,
    private readonly payoutService: PayoutService,
    private readonly web3Service: Web3Service,
    private readonly userRepository: UserRepository,
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
        let resultsUrl;
        try {
          const { chainId, escrowAddress } = webhookEntity;
          resultsUrl = await this.payoutService.executePayouts(
            chainId,
            escrowAddress,
          );
        } catch (err) {
          this.logger.error(`Error sending webhook: ${err.message}`);
          await this.webhookService.handleWebhookError(webhookEntity);
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
      const webhookEntities = await this.webhookRepository.findByStatus(
        WebhookStatus.PAID,
      );

      for (const webhookEntity of webhookEntities) {
        try {
          const { chainId, escrowAddress } = webhookEntity;

          await this.reputationService.assessReputationScores(
            chainId,
            escrowAddress,
          );

          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });

          const webhookUrls = [
            (
              await OperatorUtils.getLeader(
                chainId,
                await escrowClient.getJobLauncherAddress(escrowAddress),
              )
            ).webhookUrl,
            // Temporarily disable sending webhook to Recoring Oracle
            // (
            //   await OperatorUtils.getLeader(
            //     chainId,
            //     await escrowClient.getRecordingOracleAddress(escrowAddress),
            //   )
            // ).webhookUrl,
          ];
          const webhookBody: WebhookDto = {
            chainId,
            escrowAddress,
            eventType: EventType.ESCROW_COMPLETED,
          };
          for (const webhookUrl of webhookUrls) {
            if (!webhookUrl) {
              this.logger.log(ErrorWebhook.UrlNotFound, WebhookService.name);
              throw new NotFoundException(ErrorWebhook.UrlNotFound);
            }

            await this.webhookService.sendWebhook(webhookUrl, webhookBody);
          }
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

  /**
   * Process a pending abuse request.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async processAbuseRequests(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessRequestedAbuse,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Proccess Abuse START');
    const cronJob = await this.startCronJob(CronJobType.ProcessRequestedAbuse);

    try {
      const abuseEntities = await this.abuseRepository.findByStatus(
        AbuseStatus.PENDING,
      );

      for (const abuseEntity of abuseEntities) {
        try {
          const signer = this.web3Service.getSigner(abuseEntity.chainId);
          const escrowClient = await EscrowClient.build(signer);
          const webhookBody: WebhookDto = {
            chainId: abuseEntity.chainId,
            escrowAddress: abuseEntity.escrowAddress,
            eventType: EventType.ABUSE,
          };
          const webhookUrl = (
            await OperatorUtils.getLeader(
              abuseEntity.chainId,
              await escrowClient.getExchangeOracleAddress(
                abuseEntity.escrowAddress,
              ),
            )
          ).webhookUrl;

          if (!webhookUrl) {
            this.logger.log(ErrorWebhook.UrlNotFound, WebhookService.name);
            throw new NotFoundException(ErrorWebhook.UrlNotFound);
          }

          await this.webhookService.sendWebhook(webhookUrl, webhookBody);
          await this.abuseService.sendSlackNotification(abuseEntity);
        } catch (err) {
          this.logger.error(`Error sending abuse: ${err.message}`);
          await this.abuseService.handleAbuseError(abuseEntity);
          continue;
        }
        abuseEntity.status = AbuseStatus.NOTIFIED;
        await this.abuseRepository.updateOne(abuseEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Proccess Abuse STOP');
    await this.completeCronJob(cronJob);
  }

  /**
   * Process a classified abuse.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async processClassifiedAbuses(): Promise<void> {
    const isCronJobRunning = await this.isCronJobRunning(
      CronJobType.ProcessClassifiedAbuse,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Proccess classified abuses START');
    const cronJob = await this.startCronJob(CronJobType.ProcessClassifiedAbuse);

    try {
      const abuseEntities = await this.abuseRepository.findClassified();
      for (const abuseEntity of abuseEntities) {
        try {
          const { chainId, escrowAddress } = abuseEntity;
          const signer = this.web3Service.getSigner(chainId);
          const escrowClient = await EscrowClient.build(signer);

          const user = await this.userRepository.findById(abuseEntity.userId);

          if (abuseEntity.decision === AbuseDecision.ACCEPTED) {
            const jobLauncherAddress =
              await escrowClient.getJobLauncherAddress(escrowAddress);
            this.abuseService.slashAccount(
              user?.evmAddress as string,
              jobLauncherAddress,
              abuseEntity.chainId,
              abuseEntity.escrowAddress,
              abuseEntity.amount as number,
            );
            const webhookUrl = (
              await OperatorUtils.getLeader(chainId, jobLauncherAddress)
            ).webhookUrl;
            const webhookBody: WebhookDto = {
              chainId,
              escrowAddress,
              eventType: EventType.ABUSE,
            };
            if (!webhookUrl) {
              this.logger.log(ErrorWebhook.UrlNotFound, WebhookService.name);
              throw new NotFoundException(ErrorWebhook.UrlNotFound);
            }

            await this.webhookService.sendWebhook(webhookUrl, webhookBody);
          } else {
            await this.reputationService.decreaseReputation(
              chainId,
              user?.evmAddress as string,
              ReputationEntityType.WORKER,
            );
            const webhookBody: WebhookDto = {
              chainId: chainId,
              escrowAddress: escrowAddress,
              eventType: EventType.RESUME_ABUSE,
            };
            const webhookUrl = (
              await OperatorUtils.getLeader(
                chainId,
                await escrowClient.getExchangeOracleAddress(escrowAddress),
              )
            ).webhookUrl;

            if (!webhookUrl) {
              this.logger.log(ErrorWebhook.UrlNotFound, WebhookService.name);
              throw new NotFoundException(ErrorWebhook.UrlNotFound);
            }

            await this.webhookService.sendWebhook(webhookUrl, webhookBody);
          }
        } catch (err) {
          this.logger.error(`Error sending abuse: ${err.message}`);
          await this.abuseService.handleAbuseError(abuseEntity);
          continue;
        }
        abuseEntity.status = AbuseStatus.COMPLETED;

        await this.abuseRepository.updateOne(abuseEntity);
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Proccess classified abuses STOP');
    await this.completeCronJob(cronJob);
  }
}
