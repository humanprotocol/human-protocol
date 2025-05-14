import { Column, Entity, ManyToOne, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database';
import type { QualificationEntity } from '../qualification/qualification.entity';
import type { UserEntity } from '../user';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'user_qualifications' })
@Index(['user', 'qualification'], { unique: true })
export class UserQualificationEntity extends BaseEntity {
  @ManyToOne('UserEntity', (user: UserEntity) => user.userQualifications)
  user?: UserEntity;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(
    'QualificationEntity',
    (qualification: QualificationEntity) => qualification.userQualifications,
  )
  qualification?: QualificationEntity;

  @Column({ type: 'int' })
  qualificationId: number;
}
