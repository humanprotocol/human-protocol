/* eslint-disable camelcase -- api response*/
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { fetchAvailableJobs } from '@/modules/worker/services/fetch-available-jobs';
import type { AvailableJobsSuccessResponse } from '@/modules/worker/services/fetch-available-jobs';

export function useInfiniteAvailableJobsQuery() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracleAddress } = useParams<{ address: string }>();

  const queryParams = {
    ...filterParams,
    oracle_address: oracleAddress ?? '',
  };

  return useInfiniteQuery<AvailableJobsSuccessResponse>({
    queryKey: ['availableJobsInfinite', queryParams],
    queryFn: ({ signal }) => fetchAvailableJobs(queryParams, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.total_pages - 1 <= lastPage.page ? undefined : lastPage.page,
  });
}
