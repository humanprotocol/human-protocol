import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { TokenEntity } from '../auth/token.entity';
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
  @Column({ type: 'varchar', nullable: true })
  public password: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public email: string;

  @Column({ type: 'enum', enum: Role })
  public role: Role;

  @Column({ type: 'varchar', nullable: true, unique: true })
  public evmAddress: string;

  @Column({ type: 'varchar', nullable: true })
  public nonce: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
  })
  public status: UserStatus;

  @OneToOne(() => TokenEntity)
  public token: TokenEntity;

  @OneToOne(() => KycEntity, (kyc) => kyc.user)
  public kyc?: KycEntity;

  @OneToMany(() => SiteKeyEntity, (siteKey) => siteKey.user)
  public siteKeys?: SiteKeyEntity[];

  @OneToMany(
    () => UserQualificationEntity,
    (userQualification) => userQualification.user,
  )
  public userQualifications: UserQualificationEntity[];

  @Column({ type: 'varchar', nullable: true })
  public ndaSignedUrl?: string;
}
