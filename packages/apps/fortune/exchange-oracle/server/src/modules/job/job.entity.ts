import { Column, Entity, Index, OneToMany } from 'typeorm';

import { NS } from '../../common/constant';
import { JobStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { AssignmentEntity } from '../assignment/assignment.entity';

@Entity({ schema: NS, name: 'jobs' })
@Index(['chainId', 'escrowAddress'], { unique: true })
export class JobEntity extends BaseEntity {
  @Column({ type: 'int' })
  public chainId: number;

  @Column({ type: 'varchar' })
  public escrowAddress: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  public status: JobStatus;

  @Column({ type: 'varchar' })
  public reputationNetwork: string;

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.job, {
    cascade: true,
  })
  public assignments: AssignmentEntity[];
}
