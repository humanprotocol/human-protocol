import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
/**
 * TODO: Leave fix follow-up refactoring
 * Importing from '../user' causes circular import error here.
 */
import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';

export enum TokenType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  REFRESH = 'REFRESH',
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
  @ManyToOne(() => UserEntity)
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;
}
