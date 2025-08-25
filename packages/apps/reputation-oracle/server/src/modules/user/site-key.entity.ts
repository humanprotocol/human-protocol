import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { BaseEntity } from '@/database';

import type { UserEntity } from './user.entity';

export enum SiteKeyType {
  HCAPTCHA = 'hcaptcha',
  REGISTRATION = 'registration',
}

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'site_keys' })
@Unique(['siteKey', 'type', 'user'])
export class SiteKeyEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  siteKey: string;

  @Column({
    type: 'enum',
    enum: SiteKeyType,
  })
  type: SiteKeyType;

  @ManyToOne('UserEntity', (user: UserEntity) => user.siteKeys, {
    persistence: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;
}
