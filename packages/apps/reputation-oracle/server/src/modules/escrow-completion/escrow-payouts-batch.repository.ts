import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

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
