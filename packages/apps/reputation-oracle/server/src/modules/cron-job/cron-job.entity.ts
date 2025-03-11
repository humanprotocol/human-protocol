import { BeforeInsert, Column, Entity, Index } from 'typeorm';

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
  public cronJobType: CronJobType;

  @Column({ type: 'timestamptz' })
  public startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  public completedAt?: Date | null;

  @BeforeInsert()
  public beforeInsert(): void {
    const date = new Date();
    this.startedAt = date;
    this.createdAt = date;
    this.updatedAt = date;
  }
}
