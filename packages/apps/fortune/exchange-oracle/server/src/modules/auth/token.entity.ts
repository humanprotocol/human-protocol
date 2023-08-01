import { Column, Entity, Generated, JoinColumn, OneToOne } from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { NS } from '../../common/constants';
import { IToken } from '../../common/interfaces';
import { TokenType } from 'src/common/enums/auth';

@Entity({ schema: NS, name: 'token' })
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
  @OneToOne((_type) => UserEntity)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
