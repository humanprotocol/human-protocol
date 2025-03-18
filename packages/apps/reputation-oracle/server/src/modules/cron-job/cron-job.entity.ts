import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../database/base.entity';
import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { CronJobType } from '../../common/enums/cron-job';

@Entity({ schema: DATABASE_SCHEMA_NAME, name: 'cron-jobs' })
@Index(['cronJobType'], { unique: true })
export class CronJobEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: CronJobType,
  })
  cronJobType: CronJobType;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;
}
