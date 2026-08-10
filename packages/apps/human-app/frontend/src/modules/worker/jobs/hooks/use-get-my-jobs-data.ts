import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import * as jobsService from '../services/jobs.service';
import { type MyJobPaginationResponse } from '../schemas';
import { useMyJobsFilterStore } from './use-my-jobs-filter-store';

export function useGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const queryParams = { ...filterParams };

  return useQuery({
    queryKey: ['fetchMyJobs', queryParams],
    queryFn: async ({ signal }) =>
      jobsService.fetchMyJobs({ queryParams: queryParams, signal }),
    enabled: !!filterParams.oracle_address,
  });
}

export function useInfiniteGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const { page: _page, ...queryParams } = filterParams;

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['myJobsInfinite', queryParams],
    queryFn: async ({ pageParam, signal }) =>
      jobsService.fetchMyJobs({
        queryParams: { ...queryParams, page: pageParam },
        signal,
      }),
    enabled: !!filterParams.oracle_address,
    getNextPageParam: (pageParams: MyJobPaginationResponse) => {
      return pageParams.total_pages - 1 <= pageParams.page
        ? undefined
        : pageParams.page + 1;
    },
  });
}
