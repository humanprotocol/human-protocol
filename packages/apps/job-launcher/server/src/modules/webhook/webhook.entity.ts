import { Column, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: NS, name: 'webhook' })
@Index(['chainId', 'escrowAddress'], { unique: true })
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

  @Column({
    type: 'enum',
    enum: OracleType,
  })
  public oracleType: OracleType;

  @Column({ type: 'boolean' })
  public hasSignature: boolean;

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
