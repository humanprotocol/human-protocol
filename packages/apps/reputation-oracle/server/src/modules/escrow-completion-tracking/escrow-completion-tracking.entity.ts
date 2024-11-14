import { Column, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { EscrowCompletionTrackingStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: NS, name: 'escrow_completion_tracking' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class EscrowCompletionTrackingEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public finalResultsUrl: string;

  @Column({ type: 'varchar', nullable: true })
  public finalResultsHash: string;

  @Column({ type: 'varchar', nullable: true })
  public failureDetail: string;

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;

  @Column({
    type: 'enum',
    enum: EscrowCompletionTrackingStatus,
  })
  public status: EscrowCompletionTrackingStatus;
}
