/* eslint-disable camelcase */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useJobsFilterStore } from '../../hooks';
import { jobsService } from '../../services/jobs.service';
import { type AvailableJobsSuccessResponse } from '../../types';

export function useGetAvailableJobsData() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracle_address } = useParams<{ address: string }>();
  const queryParams = { ...filterParams, oracle_address: oracle_address ?? '' };

  return useQuery({
    queryKey: ['availableJobs', queryParams],
    queryFn: async ({ signal }) => {
      return jobsService.fetchAvailableJobs({ queryParams, signal });
    },
  });
}

export function useInifiniteGetAvailableJobsData() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracleAddress } = useParams<{ address: string }>();

  const queryParams = {
    ...filterParams,
    oracle_address: oracleAddress ?? '',
  };

  return useInfiniteQuery<AvailableJobsSuccessResponse>({
    queryKey: ['availableJobsInfinite', queryParams],
    queryFn: async ({ signal }) => {
      return jobsService.fetchAvailableJobs({ queryParams, signal });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.total_pages - 1 <= lastPage.page ? undefined : lastPage.page,
  });
}
