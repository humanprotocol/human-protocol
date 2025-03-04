import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../database/base.entity';
import { WebhookIncomingStatus } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

@Entity({ name: 'webhook_incoming' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class WebhookIncomingEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public failureDetail: string;

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;

  @Column({
    type: 'enum',
    enum: WebhookIncomingStatus,
  })
  public status: WebhookIncomingStatus;
}
