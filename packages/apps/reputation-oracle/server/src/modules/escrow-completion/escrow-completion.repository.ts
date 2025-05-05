import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';

import { ServerConfigService } from '../../config';
import { BaseRepository } from '../../database';

import { EscrowCompletionStatus } from './constants';
import { EscrowCompletionEntity } from './escrow-completion.entity';

@Injectable()
export class EscrowCompletionRepository extends BaseRepository<EscrowCompletionEntity> {
  constructor(
    dataSource: DataSource,
    private readonly serverConfigService: ServerConfigService,
  ) {
    super(EscrowCompletionEntity, dataSource);
  }

  findByStatus(
    status: EscrowCompletionStatus,
  ): Promise<EscrowCompletionEntity[]> {
    return this.find({
      where: {
        status,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'ASC',
      },
    });
  }
}
