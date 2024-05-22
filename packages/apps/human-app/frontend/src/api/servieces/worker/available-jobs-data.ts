/* eslint-disable camelcase -- api response*/
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/stringify-url-query-object';
import type { JobsFilterStoreProps } from '@/hooks/use-jobs-filter-store';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { createPaginationSchema } from '@/shared/helpers/create-pagination-schema';

const availableJobSchema = z.object({
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
  job_description: z.string().optional(),
  reward_amount: z.number().optional(),
  reward_token: z.string().optional(),
});

const availableJobsSuccessResponseSchema =
  createPaginationSchema(availableJobSchema);

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;

type GetJobTableDataDto = JobsFilterStoreProps['filterParams'];

const getAvailableJobsTableData = async (dto: GetJobTableDataDto) => {
  return apiClient(
    `${apiPaths.worker.jobs.path}?${stringifyUrlQueryObject({ ...dto })}`,
    {
      authenticated: true,
      successSchema: availableJobsSuccessResponseSchema,
      options: {
        method: 'GET',
      },
    }
  );
};

export function useGetAvailableJobsData() {
  const { filterParams } = useJobsFilterStore();

  return useQuery({
    queryKey: ['availableJobs', filterParams],
    queryFn: () => getAvailableJobsTableData(filterParams),
  });
}
