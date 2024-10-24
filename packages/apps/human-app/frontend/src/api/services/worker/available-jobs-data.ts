/* eslint-disable camelcase -- api response*/
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useMemo } from 'react';
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
  reward_amount: z.string().optional(),
  reward_token: z.string().optional(),
});

const availableJobsSuccessResponseSchema =
  createPaginationSchema(availableJobSchema);

export type AvailableJob = z.infer<typeof availableJobSchema>;
export type AvailableJobsSuccessResponse = z.infer<
  typeof availableJobsSuccessResponseSchema
>;

type GetJobTableDataDto = JobsFilterStoreProps['filterParams'] & {
  oracle_address: string;
};

const getAvailableJobsTableData = async (
  dto: GetJobTableDataDto,
  abortSignal: AbortSignal
) => {
  return apiClient(
    `${apiPaths.worker.jobs.path}?${stringifyUrlQueryObject({ ...dto })}`,
    {
      authenticated: true,
      successSchema: availableJobsSuccessResponseSchema,
      options: {
        method: 'GET',
      },
    },
    abortSignal
  );
};

const DEBOUNCE_TIME_MS = 500;

export function useGetAvailableJobsData() {
  const {
    filterParams: { escrow_address, ...filterParams },
  } = useJobsFilterStore();
  const { address: oracle_address } = useParams<{ address: string }>();
  const [debouncedEscrowAddress] = useDebounce(
    escrow_address,
    DEBOUNCE_TIME_MS
  );
  const dto = useMemo(
    () => ({
      ...filterParams,
      oracle_address: oracle_address ?? '',
      escrow_address: debouncedEscrowAddress,
    }),
    [filterParams, oracle_address, debouncedEscrowAddress]
  );

  return useQuery({
    queryKey: ['availableJobs', dto],
    queryFn: ({ signal }) => getAvailableJobsTableData(dto, signal),
  });
}

export function useInfiniteGetAvailableJobsData() {
  const {
    filterParams: { escrow_address, ...filterParams },
  } = useJobsFilterStore();
  const { address: oracle_address } = useParams<{ address: string }>();
  const [debouncedEscrowAddress] = useDebounce(
    escrow_address,
    DEBOUNCE_TIME_MS
  );
  const dto = useMemo(
    () => ({
      ...filterParams,
      oracle_address: oracle_address ?? '',
      escrow_address: debouncedEscrowAddress,
    }),
    [filterParams, oracle_address, debouncedEscrowAddress]
  );

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['availableJobsInfinite', dto],
    queryFn: ({ signal }) => getAvailableJobsTableData(dto, signal),
    getNextPageParam: (pageParams) => {
      return pageParams.total_pages - 1 <= pageParams.page
        ? undefined
        : pageParams.page;
    },
  });
}
