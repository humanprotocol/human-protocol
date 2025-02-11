import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionEntity } from './escrow-completion.entity';
import { EscrowCompletionStatus } from '../../common/enums';

@Injectable()
export class EscrowCompletionRepository extends BaseRepository<EscrowCompletionEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(EscrowCompletionEntity, dataSource);
  }

  public findByStatus(
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
