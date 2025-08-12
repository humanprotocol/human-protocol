import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import type { UserEntity } from '@/modules/user';
import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { BaseEntity } from '@/database';

export enum TokenType {
  EMAIL = 'email',
  PASSWORD = 'password',
  REFRESH = 'refresh',
}

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'tokens' })
@Index(['type', 'userId'], { unique: true })
export class TokenEntity extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  type: TokenType;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @JoinColumn()
  @ManyToOne('UserEntity', { persistence: false, onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;
}
