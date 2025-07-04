import { ChainId } from '@human-protocol/sdk';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database';
import type { UserEntity } from '../user';
import { AbuseDecision, AbuseStatus } from './constants';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'abuses' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class AbuseEntity extends BaseEntity {
  @Column({ type: 'int' })
  chainId: ChainId;

  @Column({ type: 'varchar' })
  escrowAddress: string;

  @Column({
    type: 'enum',
    enum: AbuseStatus,
  })
  status: AbuseStatus;

  @Column({
    type: 'enum',
    enum: AbuseDecision,
    nullable: true,
  })
  decision: AbuseDecision | null;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  amount: number | null;

  @Column({ type: 'text' })
  reason: string;

  @JoinColumn()
  @ManyToOne('UserEntity', { nullable: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  retriesCount: number;

  @Column({ type: 'timestamptz' })
  waitUntil: Date;
}
