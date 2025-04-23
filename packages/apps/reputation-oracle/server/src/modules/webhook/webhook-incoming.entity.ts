import { Column, Entity, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { IncomingWebhookStatus } from '../../common/enums';
import { BaseEntity } from '../../database/base.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'webhook_incoming' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class IncomingWebhookEntity extends BaseEntity {
  @Column({ type: 'int' })
  chainId: number;

  @Column({ type: 'varchar' })
  escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  failureDetail: string | null;

  @Column({ type: 'int' })
  retriesCount: number;

  @Column({ type: 'timestamptz' })
  waitUntil: Date;

  @Column({
    type: 'enum',
    enum: IncomingWebhookStatus,
  })
  status: IncomingWebhookStatus;
}
