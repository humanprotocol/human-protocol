import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';
import { QualificationEntity } from '../qualification/qualification.entity';

@Entity({ name: 'user_qualifications' })
export class UserQualificationEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.userQualifications)
  public user: UserEntity;

  @ManyToOne(
    () => QualificationEntity,
    (qualification) => qualification.userQualifications,
  )
  public qualification: QualificationEntity;
}
