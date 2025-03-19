/* eslint-disable camelcase */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/transfomers';
import { myJobsSuccessResponseSchema } from '../my-jobs/schemas';
import {
  useMyJobsFilterStore,
  type MyJobsFilterStoreProps,
} from './use-my-jobs-filter-store';

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
