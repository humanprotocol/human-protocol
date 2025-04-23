import { Column, Entity, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { OutgoingWebhookStatus } from './types';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'webhook_outgoing' })
@Index(['hash'], { unique: true })
export class OutgoingWebhookEntity extends BaseEntity {
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar' })
  hash: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  failureDetail: string | null;

  @Column({ type: 'int' })
  retriesCount: number;

  @Column({ type: 'timestamptz' })
  waitUntil: Date;

  @Column({
    type: 'enum',
    enum: OutgoingWebhookStatus,
  })
  status: OutgoingWebhookStatus;
}
