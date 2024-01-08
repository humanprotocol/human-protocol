import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CronJobEntity } from './cron-job.entity';
import { CronJobType } from '../../common/enums/cron-job';

@Injectable()
export class CronJobRepository {
  private readonly logger = new Logger(CronJobRepository.name);

  constructor(
    @InjectRepository(CronJobEntity)
    private readonly cronJobEntityRepository: Repository<CronJobEntity>,
  ) {}

  public async create(cronJobType: CronJobType): Promise<CronJobEntity> {
    return this.cronJobEntityRepository
      .create({
        cronJobType,
        startedAt: new Date(),
      })
      .save();
  }

  public async findOne(
    where: FindOptionsWhere<CronJobEntity>,
    options?: FindOneOptions<CronJobEntity>,
  ): Promise<CronJobEntity | null> {
    return this.cronJobEntityRepository.findOne({
      where,
      ...options,
    });
  }
}
