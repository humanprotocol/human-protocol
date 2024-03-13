import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { NS } from '../../common/constant';
import { AssignmentStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { JobEntity } from '../job/job.entity';

@Entity({ schema: NS, name: 'assignment' })
@Index(['jobId', 'workerAddress'], { unique: true })
export class AssignmentEntity extends BaseEntity {
  @Column({ type: 'int' })
  public jobId: number;

  @Column({ type: 'varchar' })
  public workerAddress: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
  })
  public status: AssignmentStatus;

  @ManyToOne(() => JobEntity, (job) => job.assignments, { eager: true })
  job: JobEntity;
}
