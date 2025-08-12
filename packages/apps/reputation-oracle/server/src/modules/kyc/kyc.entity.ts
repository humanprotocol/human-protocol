import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { BaseEntity } from '@/database';
import type { UserEntity } from '@/modules/user';

import { KycStatus } from './constants';

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
  @OneToOne('UserEntity', (user: UserEntity) => user.kyc, {
    persistence: false,
    onDelete: 'CASCADE',
  })
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', unique: true })
  url: string;
}
