import { Column, Entity, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { WebhookIncomingStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'webhook_incoming' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class WebhookIncomingEntity extends BaseEntity {
  @Column({ type: 'int' })
  chainId: ChainId;

  @Column({ type: 'varchar' })
  escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  failureDetail: string;

  @Column({ type: 'int' })
  retriesCount: number;

  @Column({ type: 'timestamptz' })
  waitUntil: Date;

  @Column({
    type: 'enum',
    enum: WebhookIncomingStatus,
  })
  status: WebhookIncomingStatus;
}
