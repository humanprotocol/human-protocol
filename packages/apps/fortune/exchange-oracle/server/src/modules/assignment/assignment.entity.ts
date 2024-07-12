import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { NS } from '../../common/constant';
import { AssignmentStatus } from '../../common/enums/job';
import { BaseEntity } from '../../database/base.entity';
import { JobEntity } from '../job/job.entity';

@Entity({ schema: NS, name: 'assignments' })
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

  @Column({ type: 'timestamptz' })
  public expiresAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'reward_amount' })
  public rewardAmount: number;

  @ManyToOne(() => JobEntity, (job) => job.assignments, { eager: true })
  job: JobEntity;
}
