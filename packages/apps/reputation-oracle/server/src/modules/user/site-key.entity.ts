import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
/**
 * TODO: Leave fix follow-up refactoring
 * Importing from '../user' causes circular import error here.
 */
import { UserEntity } from './user.entity';
import { SiteKeyType } from '../../common/enums';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'site_keys' })
@Unique(['siteKey', 'type', 'user'])
export class SiteKeyEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  siteKey: string;

  @Column({
    type: 'enum',
    enum: SiteKeyType,
  })
  type: SiteKeyType;

  @ManyToOne(() => UserEntity, (user) => user.siteKeys)
  @JoinColumn()
  user: UserEntity;
}
