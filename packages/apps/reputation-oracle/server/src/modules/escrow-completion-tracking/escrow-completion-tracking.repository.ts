import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { EscrowCompletionTrackingStatus } from '../../common/enums';

@Injectable()
export class EscrowCompletionTrackingRepository extends BaseRepository<EscrowCompletionTrackingEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(EscrowCompletionTrackingEntity, dataSource);
  }

  public findByStatus(
    status: EscrowCompletionTrackingStatus,
  ): Promise<EscrowCompletionTrackingEntity[]> {
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
