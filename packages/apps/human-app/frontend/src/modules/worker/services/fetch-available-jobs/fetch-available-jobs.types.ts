import { type z } from 'zod';
import type { JobsFilterStoreProps } from '@/modules/worker/hooks/use-jobs-filter-store';
import {
  type availableJobSchema,
  type availableJobsSuccessResponseSchema,
} from '@/modules/worker/services/fetch-available-jobs/fetch-available-jobs.schema';

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;

export type JobTableQueryParams = JobsFilterStoreProps['filterParams'] & {
  oracle_address: string;
};
