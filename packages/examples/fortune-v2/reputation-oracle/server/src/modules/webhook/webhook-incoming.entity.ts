import { Column, Entity } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { WebhookStatus } from '../../common/decorators';

@Entity({ schema: NS, name: 'webhook_incoming' })
export class WebhookIncomingEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: number;

  @Column({ type: 'varchar' })
  public oracleAddress: string;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({ type: 'varchar' })
  public resultsUrl: string;

  @Column({ type: 'boolean' })
  public checkPassed: boolean;

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
