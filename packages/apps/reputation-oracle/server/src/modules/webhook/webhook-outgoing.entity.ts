import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../database/base.entity';
import { WebhookOutgoingStatus } from '../../common/enums';

@Entity({ name: 'webhook_outgoing' })
@Index(['hash'], { unique: true })
export class WebhookOutgoingEntity extends BaseEntity {
  @Column({ type: 'jsonb' })
  public payload: Record<string, unknown>;

  @Column({ type: 'varchar' })
  public hash: string;

  @Column({ type: 'varchar' })
  public url: string;

  @Column({ type: 'varchar', nullable: true })
  public failureDetail: string;

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;

  @Column({
    type: 'enum',
    enum: WebhookOutgoingStatus,
  })
  public status: WebhookOutgoingStatus;
}
