import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../database/base.entity';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { EscrowCompletionStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'escrow_completion_tracking' })
@Index(['escrowAddress', 'chainId'], { unique: true })
export class EscrowCompletionEntity extends BaseEntity {
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
    enum: EscrowCompletionStatus,
  })
  public status: EscrowCompletionStatus;
}
