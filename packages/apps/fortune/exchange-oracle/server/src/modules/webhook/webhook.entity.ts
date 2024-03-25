import { Column, Entity } from 'typeorm';

import { NS } from '../../common/constant';
import { BaseEntity } from '../../database/base.entity';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: NS, name: 'webhook' })
export class WebhookEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  public eventType: EventType;

  @Column({ type: 'int' })
  public retriesCount = 0;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date = new Date();

  @Column({
    type: 'enum',
    enum: WebhookStatus,
  })
  public status: WebhookStatus = WebhookStatus.PENDING;
}
