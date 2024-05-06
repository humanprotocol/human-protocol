import { useEffect, type ReactNode } from 'react';
import { useGetAvailableJobsData } from '@/api/servieces/worker/available-jobs-data';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import type { AvailableJobs } from '@/api/servieces/worker/available-jobs-table-service-mock';

interface MyJobsDataProviderProps {
  children?: (data: {
    data: AvailableJobs | undefined;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
  }) => ReactNode;
}

export function AvailableJobsDataProvider({
  children,
}: MyJobsDataProviderProps) {
  const { data, isLoading, isError, isRefetching } = useGetAvailableJobsData();
  const { resetFilterParams } = useJobsFilterStore();

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);
  return (
    <>
      {children ? children({ data, isLoading, isError, isRefetching }) : null}
    </>
  );
}
