import { Injectable } from '@nestjs/common';
import {
  DataSource,
  FindManyOptions,
  IsNull,
  LessThanOrEqual,
  Not,
} from 'typeorm';
import { AbuseStatus } from './constants';
import { ServerConfigService } from '../../config/server-config.service';
import { BaseRepository } from '../../database/base.repository';
import { AbuseEntity } from './abuse.entity';

type FindOptions = {
  relations?: FindManyOptions<AbuseEntity>['relations'];
};

@Injectable()
export class AbuseRepository extends BaseRepository<AbuseEntity> {
  constructor(
    dataSource: DataSource,
    private readonly serverConfigService: ServerConfigService,
  ) {
    super(AbuseEntity, dataSource);
  }

  async findToClassify(): Promise<AbuseEntity[]> {
    return this.find({
      where: {
        status: AbuseStatus.PENDING,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findClassified(options: FindOptions = {}): Promise<AbuseEntity[]> {
    return this.find({
      where: {
        status: AbuseStatus.NOTIFIED,
        decision: Not(IsNull()),
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: 'ASC',
      },
      relations: options.relations,
    });
  }

  async findByUserId(userId: number): Promise<AbuseEntity[]> {
    return this.find({ where: { userId } });
  }

  async findOneById(id: number): Promise<AbuseEntity | null> {
    return this.findOne({ where: { id } });
  }
}
