import { Column, Entity, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';

import { EscrowCompletionStatus } from './constants';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'escrow_completion_tracking' })
@Index(['escrowAddress', 'chainId'], { unique: true })
export class EscrowCompletionEntity extends BaseEntity {
  @Column({ type: 'int' })
  chainId: number;

  @Column({ type: 'varchar' })
  escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  finalResultsUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  finalResultsHash: string | null;

  @Column({ type: 'varchar', nullable: true })
  failureDetail: string | null;

  @Column({ type: 'int' })
  retriesCount: number;

  @Column({ type: 'timestamptz' })
  waitUntil: Date;

  @Column({
    type: 'enum',
    enum: EscrowCompletionStatus,
  })
  status: EscrowCompletionStatus;
}
