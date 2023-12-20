import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob } from '../../common/constants/errors';

import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(private readonly cronJobRepository: CronJobRepository) {}

  public async createCronJob(cronJobType: CronJobType): Promise<CronJobEntity> {
    const cronJob = this.cronJobRepository.create(cronJobType);

    if (!cronJob) {
      this.logger.error(ErrorCronJob.NotCreated, CronJobService.name);
      throw new NotFoundException(ErrorCronJob.NotCreated);
    }

    return cronJob;
  }

  public async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOne(
      {
        cronJobType,
      },
      {
        order: {
          createdAt: 'DESC',
        },
      },
    );

    if (!lastCronJob || lastCronJob.completedAt) {
      return false;
    }

    return true;
  }

  public async completeCronJob(
    cronJobEntity: CronJobEntity,
  ): Promise<CronJobEntity> {
    if (cronJobEntity.completedAt) {
      this.logger.error(ErrorCronJob.AlreadyCompleted, CronJobService.name);
      throw new BadRequestException(ErrorCronJob.AlreadyCompleted);
    }

    cronJobEntity.completedAt = new Date();
    return cronJobEntity.save();
  }
}
