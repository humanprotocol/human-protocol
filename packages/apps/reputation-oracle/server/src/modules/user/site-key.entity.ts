import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from './user.entity';

@Entity({ schema: NS, name: 'site_keys' })
export class SiteKeyEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public siteKey: string;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  public user: UserEntity;
}
