/* eslint-disable camelcase -- api response*/
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/transfomers';
import { createPaginationSchema } from '@/shared/helpers/pagination';
import type { MyJobsFilterStoreProps } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';

export enum MyJobStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  VALIDATION = 'VALIDATION',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export const UNKNOWN_JOB_STATUS = 'UNKNOWN';

const myJobSchema = z.object({
  assignment_id: z.string(),
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string().transform((value) => {
    try {
      return z.nativeEnum(MyJobStatus).parse(value.toUpperCase());
    } catch (error) {
      return UNKNOWN_JOB_STATUS;
    }
  }),
  reward_amount: z.string(),
  reward_token: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  url: z.string().optional().nullable(),
});

const myJobsSuccessResponseSchema = createPaginationSchema(myJobSchema);

export type MyJob = z.infer<typeof myJobSchema>;
export type MyJobsSuccessResponse = z.infer<typeof myJobsSuccessResponseSchema>;
export interface MyJobsWithJobTypes {
  jobTypes: string[];
  jobs: MyJobsSuccessResponse;
}

type GetMyJobTableDataDto = MyJobsFilterStoreProps['filterParams'] & {
  oracle_address: string;
};

const getMyJobsTableData = async (
  dto: GetMyJobTableDataDto,
  abortSignal: AbortSignal
) => {
  return apiClient(
    `${apiPaths.worker.myJobs.path}?${stringifyUrlQueryObject({ ...dto })}`,
    {
      authenticated: true,
      successSchema: myJobsSuccessResponseSchema,
      options: {
        method: 'GET',
      },
    },
    abortSignal
  );
};

export function useGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const { address } = useParams<{ address: string }>();
  const dto = { ...filterParams, oracle_address: address ?? '' };
  return useQuery({
    queryKey: ['myJobs', dto],
    queryFn: ({ signal }) => getMyJobsTableData(dto, signal),
  });
}

export function useInfiniteGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const { address } = useParams<{ address: string }>();
  const dto = { ...filterParams, oracle_address: address ?? '' };

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['myJobsInfinite', dto],
    queryFn: ({ signal }) => getMyJobsTableData(dto, signal),
    getNextPageParam: (pageParams) => {
      return pageParams.total_pages - 1 <= pageParams.page
        ? undefined
        : pageParams.page;
    },
  });
}
