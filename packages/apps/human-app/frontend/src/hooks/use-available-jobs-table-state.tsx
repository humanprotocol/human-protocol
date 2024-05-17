import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AvailableJobsSuccessResponse } from '@/api/servieces/worker/available-jobs-data';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

export function useAvailableJobsTableState() {
  const { filterParams } = useJobsFilterStore();

  const queryClient = useQueryClient();
  const queryState = queryClient.getQueryState(['availableJobs', filterParams]);
  const queryData = queryClient.getQueryData<AvailableJobsSuccessResponse>([
    'availableJobs',
    filterParams,
  ]);

  const availableJobsTableQueryData = useMemo(() => {
    if (!queryData?.results) return [];
    return queryData.results;
  }, [queryData?.results]);
  return {
    availableJobsTableState: queryState,
    availableJobsTableQueryData,
  };
}
