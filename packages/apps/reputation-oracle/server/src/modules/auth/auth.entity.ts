import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { NS } from '../../common/constants';
import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';

@Entity({ schema: NS, name: 'auths' })
export class AuthEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public accessToken: string;

  @Column({ type: 'varchar' })
  public refreshToken: string;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
