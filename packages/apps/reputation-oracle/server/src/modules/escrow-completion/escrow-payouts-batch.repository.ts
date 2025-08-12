import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/database';
import { DataSource } from 'typeorm';
import { EscrowPayoutsBatchEntity } from './escrow-payouts-batch.entity';

@Injectable()
export class EscrowPayoutsBatchRepository extends BaseRepository<EscrowPayoutsBatchEntity> {
  constructor(dataSource: DataSource) {
    super(EscrowPayoutsBatchEntity, dataSource);
  }

  async findForEscrowCompletionTracking(
    escrowCompletionTrackingId: number,
  ): Promise<EscrowPayoutsBatchEntity[]> {
    return this.find({
      where: {
        escrowCompletionTrackingId,
      },
    });
  }
}
