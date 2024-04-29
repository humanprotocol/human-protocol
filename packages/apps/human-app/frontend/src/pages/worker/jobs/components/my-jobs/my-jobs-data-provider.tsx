import { useEffect, type ReactNode } from 'react';
import { useGetMyJobsData } from '@/api/servieces/worker/my-jobs-data';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { type MyJobs } from './my-jobs-table-service';

interface MyJobsDataProviderProps {
  children: (data: {
    data: MyJobs | undefined;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
  }) => ReactNode;
}

export const MyJobsDataProvider: React.FC<MyJobsDataProviderProps> = ({
  children,
}) => {
  const { data, isLoading, isError, isRefetching } = useGetMyJobsData();
  const { resetFilterParams } = useJobsFilterStore();

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);

  return children({ data, isLoading, isError, isRefetching });
};
