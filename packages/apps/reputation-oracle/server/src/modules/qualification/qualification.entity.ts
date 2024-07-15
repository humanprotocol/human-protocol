import { Column, Entity, Index, OneToMany } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserQualificationEntity } from './user-qualification.entity';

@Entity({ schema: NS, name: 'qualifications' })
@Index(['reference'], { unique: true })
export class QualificationEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public reference: string;

  @Column({ type: 'text' })
  public title: string;

  @Column({ type: 'text' })
  public description: string;

  @Column({ type: 'timestamp', nullable: true })
  public expiresAt?: Date | null;

  @OneToMany(
    () => UserQualificationEntity,
    (userQualification) => userQualification.qualification,
  )
  public userQualifications: UserQualificationEntity[];
}
