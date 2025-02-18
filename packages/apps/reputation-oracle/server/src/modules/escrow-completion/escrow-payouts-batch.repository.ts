import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { EscrowPayoutsBatchEntity } from './escrow-payouts-batch.entity';

@Injectable()
export class EscrowPayoutsBatchRepository extends BaseRepository<EscrowPayoutsBatchEntity> {
  constructor(private dataSource: DataSource) {
    super(EscrowPayoutsBatchEntity, dataSource);
  }

  public async findForEscrowCompletionTracking(
    escrowCompletionTrackingId: number,
  ): Promise<EscrowPayoutsBatchEntity[]> {
    return this.find({
      where: {
        escrowCompletionTrackingId,
      },
    });
  }
}
