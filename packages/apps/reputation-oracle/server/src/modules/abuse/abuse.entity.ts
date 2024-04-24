import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { ChainId } from '@human-protocol/sdk';
import { AbuseDecision, AbuseStatus } from 'src/common/enums/abuse';

@Entity({ schema: NS, name: 'abuses' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class AbuseEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: ChainId;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({
    type: 'enum',
    enum: AbuseStatus,
  })
  public status = AbuseStatus.PENDING;

  @Column({
    type: 'enum',
    enum: AbuseDecision,
    nullable: true,
  })
  public decision?: AbuseDecision;

  @Column({ type: 'decimal', precision: 30, scale: 18, nullable: true })
  public amount?: number;

  @JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.abuse)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;

  @Column({ type: 'int' })
  public retriesCount = 0;

  @Column({ type: 'timestamptz' })
  public waitUntil = new Date();
}
