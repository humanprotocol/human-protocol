import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

import { CronJobType } from './constants';
import { CronJobEntity } from './cron-job.entity';

@Injectable()
export class CronJobRepository extends BaseRepository<CronJobEntity> {
  constructor(dataSource: DataSource) {
    super(CronJobEntity, dataSource);
  }

  async findOneByType(type: CronJobType): Promise<CronJobEntity | null> {
    return this.findOne({ where: { cronJobType: type } });
  }
}
