import { Column, Entity, Index } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '../../common/constants';
import { BaseEntity } from '../../database/base.entity';

import { CronJobType } from './constants';

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
  completedAt: Date | null;
}
