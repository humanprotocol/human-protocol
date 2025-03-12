import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
/**
 * TODO: Leave fix follow-up refactoring
 * Importing from '../user' causes circular import error here.
 */
import { UserEntity } from './user.entity';
import { SiteKeyType } from '../../common/enums';

// TypeORM doesn't natively support partial unique indices.
// To ensure a user can only have one record in the site_keys table with the type 'hcaptcha',
// we enforce a partial unique index at the database level.
@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'site_keys' })
@Unique(['siteKey', 'type', 'user'])
export class SiteKeyEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  public siteKey: string;

  @Column({
    type: 'enum',
    enum: SiteKeyType,
  })
  public type: SiteKeyType;

  @ManyToOne(() => UserEntity, (user) => user.siteKeys)
  @JoinColumn()
  public user: UserEntity;
}
