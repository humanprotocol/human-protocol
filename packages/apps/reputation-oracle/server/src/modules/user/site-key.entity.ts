import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from './user.entity';
import { OracleType } from '../../common/enums';

@Entity({ schema: NS, name: 'site_keys' })
@Index(['siteKey', 'type'], { unique: true })
export class SiteKeyEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public siteKey: string;

  @Column({
    type: 'enum',
    enum: OracleType,
  })
  public type: OracleType;

  @JoinColumn()
  @OneToOne(() => UserEntity, (user) => user.siteKey)
  public user: UserEntity;
}
