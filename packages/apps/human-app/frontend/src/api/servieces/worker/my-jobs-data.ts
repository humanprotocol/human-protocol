/* eslint-disable camelcase -- api response*/
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/stringify-url-query-object';
import { createPaginationSchema } from '@/shared/helpers/create-pagination-schema';
import { getOracles } from '@/api/servieces/worker/oracles';
import type { MyJobsFilterStoreProps } from '@/hooks/use-my-jobs-filter-store';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';

const myJobSchema = z.object({
  assignment_id: z.number(),
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
  reward_amount: z.number(),
  reward_token: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  url: z.string(),
});
const myJobsSuccessResponseSchema = createPaginationSchema(myJobSchema);

export type MyJob = z.infer<typeof myJobSchema>;
export type MyJobsSuccessResponse = z.infer<typeof myJobsSuccessResponseSchema>;
export interface MyJobsWithJobTypes {
  jobTypes: string[];
  jobs: MyJobsSuccessResponse;
}

type GetMyJobTableDataDto = MyJobsFilterStoreProps['filterParams'];

const getMyJobsTableData = async (dto: GetMyJobTableDataDto) => {
  const oraclesResponse = await getOracles();
  const oracle_address = oraclesResponse[0].address;
  const jobTypes = oraclesResponse[0].jobTypes.map((jobType) =>
    jobType.toUpperCase()
  );

  const jobs = await apiClient(
    `${apiPaths.worker.myJobs.path}?${stringifyUrlQueryObject({ ...dto, address: oracle_address })}`,
    {
      authenticated: true,
      successSchema: myJobsSuccessResponseSchema,
      options: {
        method: 'GET',
      },
    }
  );

  return {
    jobs,
    jobTypes,
  };
};

export function useGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();

  return useQuery({
    queryKey: ['myJobs', filterParams],
    queryFn: () => getMyJobsTableData(filterParams),
  });
}
