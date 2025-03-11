import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { KycStatus } from './constants';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
/**
 * TODO: Leave fix follow-up refactoring
 * Importing from '../user' causes circular import error here.
 */
import { UserEntity } from '../user/user.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'kycs' })
export class KycEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true, primary: true })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NONE,
  })
  status: KycStatus;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  message: string | null;

  @JoinColumn()
  @OneToOne(() => UserEntity, (user) => user.kyc)
  user: UserEntity;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', unique: true })
  url: string;
}
