import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { ICronJob } from '../../common/interfaces/cron-job';
import { CronJobType } from '../../common/enums/cron-job';

@Entity({ schema: NS, name: 'cron-jobs' })
@Index(['cronJobType', 'createdAt'], { unique: true })
export class CronJobEntity extends BaseEntity implements ICronJob {
  @Column({
    type: 'enum',
    enum: CronJobType,
  })
  public cronJobType: CronJobType;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  public completedAt?: Date;
}
