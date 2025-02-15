import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/transfomers';
import type {
  AvailableJobsSuccessResponse,
  JobTableQueryParams,
} from '@/modules/worker/services/fetch-available-jobs/fetch-available-jobs.types';
import { availableJobsSuccessResponseSchema } from '@/modules/worker/services/fetch-available-jobs/fetch-available-jobs.schema';

export async function fetchAvailableJobs(
  params: JobTableQueryParams,
  abortSignal: AbortSignal
): Promise<AvailableJobsSuccessResponse> {
  const endpoint = `${apiPaths.worker.jobs.path}?${stringifyUrlQueryObject(params)}`;

  return apiClient(
    endpoint,
    {
      authenticated: true,
      successSchema: availableJobsSuccessResponseSchema,
      options: { method: 'GET' },
    },
    abortSignal
  );
}
