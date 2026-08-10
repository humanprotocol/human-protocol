import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import * as jobsService from '../../services/jobs.service';
import { type AvailableJobsSuccessResponse } from '../../types';

type Props = {
  oracleAddress?: string;
};

export function useGetAvailableJobsData({ oracleAddress }: Props) {
  const queryParams = { oracle_address: oracleAddress };

  return useQuery({
    queryKey: ['availableJobs', queryParams],
    queryFn: async ({ signal }) =>
      jobsService.fetchAvailableJobs({ queryParams, signal }),
    enabled: !!oracleAddress,
  });
}

export function useInifiniteGetAvailableJobsData({ oracleAddress }: Props) {
  const queryParams = { oracle_address: oracleAddress };

  return useInfiniteQuery<AvailableJobsSuccessResponse>({
    queryKey: ['availableJobsInfinite', queryParams],
    queryFn: async ({ signal }) =>
      jobsService.fetchAvailableJobs({ queryParams, signal }),
    enabled: !!oracleAddress,
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.total_pages - 1 <= lastPage.page ? undefined : lastPage.page,
  });
}
