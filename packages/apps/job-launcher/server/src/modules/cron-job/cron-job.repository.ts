import { Injectable } from '@nestjs/common';
import { CronJobType } from 'src/common/enums/cron-job';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { handleQueryFailedError } from '../../database/database.error';
import { CronJobEntity } from './cron-job.entity';

@Injectable()
export class CronJobRepository extends Repository<CronJobEntity> {
  constructor(private dataSource: DataSource) {
    super(CronJobEntity, dataSource.createEntityManager());
  }

  async createUnique(type: CronJobType): Promise<CronJobEntity> {
    const cronJobEntity = new CronJobEntity();
    cronJobEntity.cronJobType = type;
    try {
      await this.insert(cronJobEntity);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return cronJobEntity;
  }

  public async updateOne(cron: CronJobEntity): Promise<CronJobEntity> {
    try {
      await this.save(cron);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return cron;
  }

  public async findOneByType(type: CronJobType): Promise<CronJobEntity | null> {
    return this.findOne({ where: { cronJobType: type } });
  }
}
