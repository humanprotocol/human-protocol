import { useEffect, type ReactNode } from 'react';
import { useGetAvailableJobsData } from '@/api/servieces/worker/available-jobs-data';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import type { AvailableJobs } from './available-jobs-table-service';

interface MyJobsDataProviderProps {
  children: (data: {
    data: AvailableJobs | undefined;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
  }) => ReactNode;
}

export const AvailableJobsDataProvider: React.FC<MyJobsDataProviderProps> = ({
  children,
}) => {
  const { data, isLoading, isError, isRefetching } = useGetAvailableJobsData();
  const { resetFilterParams } = useJobsFilterStore();

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);
  return children({ data, isLoading, isError, isRefetching });
};
