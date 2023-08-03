import { Column, Entity, Generated, JoinColumn, OneToOne } from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { NS } from '../../common/constants';
import { IBase } from '../../common/interfaces/base';

export enum TokenType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
}

export interface IToken extends IBase {
  uuid: string;
  tokenType: TokenType;
}

@Entity({ schema: NS, name: 'tokens' })
export class TokenEntity extends BaseEntity implements IToken {
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  public uuid: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  public tokenType: TokenType;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
