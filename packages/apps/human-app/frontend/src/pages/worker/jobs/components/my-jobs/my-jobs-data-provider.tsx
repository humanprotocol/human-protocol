import type { ReactNode } from 'react';
import { useGetMyJobsData } from '@/api/servieces/worker/my-jobs-data';
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

  return children({ data, isLoading, isError, isRefetching });
};
