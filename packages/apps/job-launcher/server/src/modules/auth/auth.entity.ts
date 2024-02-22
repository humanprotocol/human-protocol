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

  @Column({ type: 'varchar', unique: true })
  public accessJwtId: string;

  @Column({ type: 'varchar', unique: true })
  public refreshJwtId: string;

  @JoinColumn()
  @OneToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  public user: UserEntity;

  @Column({ type: 'int' })
  public userId: number;
}
