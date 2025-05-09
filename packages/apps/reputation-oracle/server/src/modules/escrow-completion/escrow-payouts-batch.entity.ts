import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../database';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';

import type { EscrowCompletionEntity } from './escrow-completion.entity';

type EscrowPayout = {
  address: string;
  amount: string;
};

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'escrow_payouts_batch' })
@Index(['escrowCompletionTrackingId', 'payoutsHash'], { unique: true })
export class EscrowPayoutsBatchEntity extends BaseEntity {
  @ManyToOne('EscrowCompletionEntity', { onDelete: 'CASCADE' })
  escrowCompletionTracking?: EscrowCompletionEntity;

  @Column()
  escrowCompletionTrackingId: number;
  /**
   * Storing it as `json` in order to store it "as-is",
   * so if needed we can easilly see the original data.
   * No need to query or index this field, just store.
   */
  @Column({ type: 'json' })
  payouts: EscrowPayout[];

  @Column({ type: 'varchar' })
  payoutsHash: string;

  @Column({ type: 'int', nullable: true })
  txNonce: number | null;
}
