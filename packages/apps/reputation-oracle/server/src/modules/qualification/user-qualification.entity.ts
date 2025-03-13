import { Entity, ManyToOne } from 'typeorm';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import type { UserEntity } from '../user';
import type { QualificationEntity } from '../qualification/qualification.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'user_qualifications' })
export class UserQualificationEntity extends BaseEntity {
  @ManyToOne('UserEntity', (user: UserEntity) => user.userQualifications)
  public user: UserEntity;

  @ManyToOne(
    'QualificationEntity',
    (qualification: QualificationEntity) => qualification.userQualifications,
  )
  public qualification: QualificationEntity;
}
