import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { KycStatus } from '../../common/enums/user';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'kycs' })
export class KycEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true, primary: true })
  public sessionId: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NONE,
  })
  public status: KycStatus;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  public message?: string;

  @JoinColumn()
  @OneToOne(() => UserEntity, (user) => user.kyc)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
