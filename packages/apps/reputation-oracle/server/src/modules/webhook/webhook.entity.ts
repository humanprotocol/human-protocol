import { Column, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { WebhookStatus, WebhookType } from '../../common/enums';
import { ChainId } from '@human-protocol/sdk';

@Entity({ schema: NS, name: 'webhook' })
@Index(['chainId', 'escrowAddress', 'type', 'callbackUrl'], { unique: true })
export class WebhookEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public resultsUrl: string;

  @Column({ type: 'varchar', nullable: true })
  public callbackUrl: string | null;

  @Column({ type: 'enum', enum: WebhookType })
  public type: WebhookType;

  @Column({ type: 'varchar', nullable: true })
  public failedReason: string;

  @Column({ type: 'int' })
  public retriesCount: number;

  @Column({ type: 'timestamptz' })
  public waitUntil: Date;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
  })
  public status: WebhookStatus;
}
