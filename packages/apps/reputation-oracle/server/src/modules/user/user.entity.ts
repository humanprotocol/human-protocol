import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database';

import type { KycEntity } from '../kyc/kyc.entity';
import type { UserQualificationEntity } from '../qualification/user-qualification.entity';

import type { SiteKeyEntity } from './site-key.entity';

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export enum Role {
  OPERATOR = 'operator',
  WORKER = 'worker',
  ADMIN = 'admin',
}

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'users' })
export class UserEntity extends BaseEntity {
  @Exclude()
  @Column({
    type: 'varchar',
    nullable: true,
  })
  password: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  email: string | null;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  evmAddress: string | null;

  @Exclude()
  @Column({
    type: 'varchar',
    nullable: true,
  })
  nonce: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  status: UserStatus;

  @OneToOne('KycEntity', (kyc: KycEntity) => kyc.user)
  kyc?: KycEntity;

  @OneToMany('SiteKeyEntity', (siteKey: SiteKeyEntity) => siteKey.user)
  siteKeys?: SiteKeyEntity[];

  @OneToMany(
    'UserQualificationEntity',
    (userQualification: UserQualificationEntity) => userQualification.user,
  )
  userQualifications?: UserQualificationEntity[];

  @Column({
    type: 'varchar',
    nullable: true,
  })
  ndaSignedUrl: string | null;
}
