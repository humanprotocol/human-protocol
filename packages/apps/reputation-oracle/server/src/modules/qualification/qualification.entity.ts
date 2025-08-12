import { Column, Entity, Index, OneToMany } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';
import { BaseEntity } from '@/database';
import type { UserQualificationEntity } from './user-qualification.entity';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'qualifications' })
@Index(['reference'], { unique: true })
export class QualificationEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @OneToMany(
    'UserQualificationEntity',
    (userQualification: UserQualificationEntity) =>
      userQualification.qualification,
  )
  userQualifications?: UserQualificationEntity[];
}
