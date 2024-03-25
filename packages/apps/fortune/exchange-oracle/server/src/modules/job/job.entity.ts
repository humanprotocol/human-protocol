import { Column, Entity, Index, OneToMany } from 'typeorm';

import { NS } from '../../common/constant';
import { JobStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { AssignmentEntity } from '../assignment/assignment.entity';

@Entity({ schema: NS, name: 'job' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class JobEntity extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  public chainId: number;

  @Column({ type: 'varchar', nullable: true })
  public escrowAddress: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  public status: JobStatus;

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.job)
  public assignments: AssignmentEntity[];
}
