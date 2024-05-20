import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import type { MyJobsWithJobTypes } from '@/api/servieces/worker/my-jobs-data';

export function useMyJobsTableState() {
  const { filterParams } = useMyJobsFilterStore();
  const queryClient = useQueryClient();

  const queryState = queryClient.getQueryState(['myJobs', filterParams]);
  const queryData = queryClient.getQueryData<MyJobsWithJobTypes>([
    'myJobs',
    filterParams,
  ]);

  const myJobsTableQueryData = useMemo(() => {
    if (!queryData?.jobs.results) return [];
    return queryData.jobs.results;
  }, [queryData?.jobs.results]);

  return {
    myJobsTableState: queryState,
    myJobsTableQueryData,
    jobTypes: queryData?.jobTypes || [],
  };
}
