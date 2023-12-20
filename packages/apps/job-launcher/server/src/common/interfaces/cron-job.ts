import { CronJobType } from '../enums/cron-job';
import { IBase } from './base';

export interface ICronJob extends IBase {
  cronJobType: CronJobType;
  createdAt: Date;
  completedAt?: Date;
}
