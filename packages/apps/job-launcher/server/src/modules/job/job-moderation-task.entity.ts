import { Column, Entity, ManyToOne } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { JobEntity } from './job.entity';
import { JobModerationTaskStatus } from 'src/common/enums/job';

@Entity({ schema: NS, name: 'job-moderation-tasks' })
export class JobModerationTaskEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  public dataUrl: string;

  @Column({ type: 'int', nullable: false })
  public from: number;

  @Column({ type: 'int', nullable: false })
  public to: number;

  @Column({ type: 'varchar', nullable: true })
  public abuseReason: string;

  @Column({
    type: 'enum',
    enum: JobModerationTaskStatus,
  })
  public status: JobModerationTaskStatus;

  @Column({ type: 'int' })
  public jobId: number;

  @ManyToOne(() => JobEntity, (job) => job.jobModerationTasks, { eager: true })
  job: JobEntity;
}
