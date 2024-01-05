import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(private readonly cronJobRepository: CronJobRepository) {}

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
}
