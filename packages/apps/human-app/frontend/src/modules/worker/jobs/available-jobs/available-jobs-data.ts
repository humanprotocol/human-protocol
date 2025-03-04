/* eslint-disable camelcase -- api response*/
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/transfomers';
import { createPaginationSchema } from '@/shared/helpers/pagination';
import { type JobsFilterStoreProps, useJobsFilterStore } from '../hooks';

const availableJobSchema = z.object({
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
  job_description: z.string().optional(),
  reward_amount: z.string().optional(),
  reward_token: z.string().optional(),
});

const availableJobsSuccessResponseSchema =
  createPaginationSchema(availableJobSchema);

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;

type JobTableQueryParams = JobsFilterStoreProps['filterParams'] & {
  oracle_address: string;
};

const getAvailableJobsTableData = async (
  params: JobTableQueryParams,
  abortSignal: AbortSignal
) => {
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
};

export function useGetAvailableJobsData() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracle_address } = useParams<{ address: string }>();
  const dto = { ...filterParams, oracle_address: oracle_address ?? '' };

  return useQuery({
    queryKey: ['availableJobs', dto],
    queryFn: ({ signal }) => getAvailableJobsTableData(dto, signal),
  });
}

export function useInfiniteAvailableJobsQuery() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracleAddress } = useParams<{ address: string }>();

  const queryParams = {
    ...filterParams,
    oracle_address: oracleAddress ?? '',
  };

  return useInfiniteQuery<AvailableJobsSuccessResponse>({
    queryKey: ['availableJobsInfinite', queryParams],
    queryFn: ({ signal }) => getAvailableJobsTableData(queryParams, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.total_pages - 1 <= lastPage.page ? undefined : lastPage.page,
  });
}
