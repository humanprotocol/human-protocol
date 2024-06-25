import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ schema: NS, name: 'qualifications' })
export class QualificationEntity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  public reference: string;

  @Column({ type: 'text' })
  public title: string;

  @Column({ type: 'text' })
  public description: string;

  @Column({ type: 'timestamp', nullable: true })
  public expiresAt?: Date | null;

  @ManyToMany(() => UserEntity, (user) => user.qualifications)
  @JoinTable({ name: 'qualification_user' })
  users: UserEntity[];
}
