import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import type { EscrowCompletionEntity } from './escrow-completion.entity';

export type EscrowPayout = {
  address: string;
  amount: string;
};

@Entity({ schema: NS, name: 'escrow_payouts_batch' })
@Index(['escrowCompletionTrackingId', 'payoutsHash'], { unique: true })
export class EscrowPayoutsBatchEntity extends BaseEntity {
  @ManyToOne('EscrowCompletionEntity', { onDelete: 'CASCADE' })
  escrowCompletionTracking: EscrowCompletionEntity;

  @Column()
  escrowCompletionTrackingId: number;
  /**
   * Storing it as `json` in order to store it "as-is",
   * so if needed we can easilly see the original data.
   * No need to query or index this field, just store.
   */
  @Column({ type: 'json' })
  public payouts: EscrowPayout[];

  @Column({ type: 'varchar' })
  public payoutsHash: string;

  @Column({ type: 'int', nullable: true })
  public txNonce?: number;
}
