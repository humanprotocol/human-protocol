import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { NS } from '../../common/constants';
import { UserEntity } from '../user/user.entity';
import { BaseEntity } from '../../database/base.entity';
import { AuthStatus } from '../../common/enums/auth';

@Entity({ schema: NS, name: 'auths' })
export class AuthEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public refreshToken: string;

  @Column({
    type: 'enum',
    enum: AuthStatus,
  })
  public status: AuthStatus;

  @JoinColumn()
  @OneToOne(() => UserEntity)
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
