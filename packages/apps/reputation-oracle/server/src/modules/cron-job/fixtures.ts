import { faker } from '@faker-js/faker';
import { CronJobEntity } from './cron-job.entity';
import { CronJobType } from './constants';

const cronJobTypes = Object.values(CronJobType);

export function generateCronJob(
  overrides: Partial<CronJobEntity> = {},
): CronJobEntity {
  return {
    id: faker.number.int(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
    cronJobType: faker.helpers.arrayElement(cronJobTypes),
    startedAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}
