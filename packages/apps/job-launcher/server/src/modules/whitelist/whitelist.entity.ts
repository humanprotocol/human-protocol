import { NS } from '../../common/constants';
import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'whitelist' })
export class WhitelistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @OneToOne(() => UserEntity, { nullable: false })
  public user: UserEntity;
}
