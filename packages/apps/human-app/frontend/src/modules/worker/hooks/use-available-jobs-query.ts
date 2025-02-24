/* eslint-disable camelcase -- api response*/
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { fetchAvailableJobs } from '@/modules/worker/services/fetch-available-jobs';
import type { AvailableJobsSuccessResponse } from '@/modules/worker/services/fetch-available-jobs';

export function useAvailableJobsQuery() {
  const { filterParams } = useJobsFilterStore();
  const { address: oracleAddress } = useParams<{ address: string }>();

  const queryParams = {
    ...filterParams,
    oracle_address: oracleAddress ?? '',
  };

  return useQuery<AvailableJobsSuccessResponse>({
    queryKey: ['availableJobs', queryParams],
    queryFn: ({ signal }) => fetchAvailableJobs(queryParams, signal),
  });
}
