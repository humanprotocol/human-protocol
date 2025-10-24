import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
} from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { BaseEntity } from '@/database';

import { UserEntity } from '../user';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'exchange_api_keys' })
@Index(['userId', 'exchangeName'], { unique: true })
export class ExchangeApiKeyEntity extends BaseEntity {
  @Column('varchar', { length: 20 })
  exchangeName: string;

  @Column('varchar', { length: 1000 })
  apiKey: string;

  @Column('varchar', { length: 10000 })
  secretKey: string;

  @ManyToOne('UserEntity', { persistence: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId: number;

  @BeforeInsert()
  protected beforeInsert(): void {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  protected beforeUpdate(): void {
    this.updatedAt = new Date();
  }
}
