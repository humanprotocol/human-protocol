import { BeforeInsert, Column, Entity, Index } from 'typeorm';

import { NS } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';
import { ICronJob } from '../../common/interfaces/cron-job';
import { CronJobType } from '../../common/enums/cron-job';

@Entity({ schema: NS, name: 'cron-jobs' })
@Index(['cronJobType'], { unique: true })
export class CronJobEntity extends BaseEntity implements ICronJob {
  @Column({
    type: 'enum',
    enum: CronJobType,
  })
  public cronJobType: CronJobType;

  @Column({ type: 'timestamptz' })
  public startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  public completedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  public lastSubgraphTime?: Date | null;

  @BeforeInsert()
  public beforeInsert(): void {
    const date = new Date();
    this.startedAt = date;
    this.createdAt = date;
    this.updatedAt = date;
  }
}
