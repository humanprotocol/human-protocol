import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import type { MyJobsSuccessResponse } from '@/api/servieces/worker/my-jobs-data';

export function useMyJobsTableState() {
  const { filterParams } = useMyJobsFilterStore();
  const queryClient = useQueryClient();

  const queryState = queryClient.getQueryState(['myJobs', filterParams]);
  const queryData = queryClient.getQueryData<MyJobsSuccessResponse>([
    'myJobs',
    filterParams,
  ]);

  const myJobsTableQueryData = useMemo(() => {
    if (!queryData?.results) return [];
    return queryData.results;
  }, [queryData?.results]);

  return {
    myJobsTableState: queryState,
    myJobsTableQueryData,
  };
}
