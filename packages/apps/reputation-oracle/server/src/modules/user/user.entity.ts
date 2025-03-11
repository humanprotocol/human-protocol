import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { KycEntity } from '../kyc/kyc.entity';
import { SiteKeyEntity } from './site-key.entity';
import { UserQualificationEntity } from '../qualification/user-qualification.entity';

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export enum Role {
  OPERATOR = 'operator',
  WORKER = 'worker',
  HUMAN_APP = 'human_app',
  ADMIN = 'admin',
}

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'users' })
export class UserEntity extends BaseEntity {
  @Exclude()
  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  password: string;

  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
    unique: true,
  })
  email: string;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
    unique: true,
  })
  evmAddress: string;

  @Exclude()
  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  nonce: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  status: UserStatus;

  @OneToOne(() => KycEntity, (kyc) => kyc.user)
  kyc?: KycEntity;

  @OneToMany(() => SiteKeyEntity, (siteKey) => siteKey.user)
  siteKeys?: SiteKeyEntity[];

  @OneToMany(
    () => UserQualificationEntity,
    (userQualification) => userQualification.user,
  )
  userQualifications?: UserQualificationEntity[];

  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  ndaSignedUrl: string | null;
}
