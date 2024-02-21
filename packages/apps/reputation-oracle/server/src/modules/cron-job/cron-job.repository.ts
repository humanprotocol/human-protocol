import { Injectable } from '@nestjs/common';
import { CronJobType } from '../../common/enums/cron-job';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { CronJobEntity } from './cron-job.entity';

@Injectable()
export class CronJobRepository extends BaseRepository<CronJobEntity> {
  constructor(private dataSource: DataSource) {
    super(CronJobEntity, dataSource);
  }

  public async findOneByType(type: CronJobType): Promise<CronJobEntity | null> {
    return this.findOne({ where: { cronJobType: type } });
  }
}
