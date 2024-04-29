import type { ReactNode } from 'react';
import { useGetAvailableJobsData } from '@/api/servieces/worker/available-jobs-data';
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

  return children({ data, isLoading, isError, isRefetching });
};
