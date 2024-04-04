import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { NS } from '../../common/constants';
import { IBase } from '../../common/interfaces/base';

export enum TokenType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  REFRESH = 'REFRESH',
}

export interface IToken extends IBase {
  uuid: string;
  type: TokenType;
}

@Entity({ schema: NS, name: 'tokens' })
@Index(['type', 'userId'], { unique: true })
export class TokenEntity extends BaseEntity implements IToken {
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  public uuid: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  public type: TokenType;

  @Column({ type: 'timestamptz' })
  public expiresAt: Date;

  @JoinColumn()
  @ManyToOne(() => UserEntity, { eager: true })
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
