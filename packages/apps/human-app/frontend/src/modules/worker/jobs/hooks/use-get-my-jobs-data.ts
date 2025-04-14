/* eslint-disable camelcase */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { jobsService } from '../services/jobs.service';
import { type MyJobPaginationResponse } from '../schemas';
import {
  useMyJobsFilterStore,
  type MyJobsFilterStoreProps,
} from './use-my-jobs-filter-store';

type OracleParams = MyJobsFilterStoreProps['filterParams'] & {
  oracle_address: string;
};

export function useGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const { address } = useParams<{ address: string }>();
  const queryParams: OracleParams = {
    ...filterParams,
    oracle_address: address ?? '',
  };

  return useQuery({
    queryKey: ['myJobs', queryParams],
    queryFn: async ({ signal }) => {
      return jobsService.fetchMyJobs({ queryParams, signal });
    },
  });
}

export function useInfiniteGetMyJobsData() {
  const { filterParams } = useMyJobsFilterStore();
  const { address } = useParams<{ address: string }>();
  const queryParams: OracleParams = {
    ...filterParams,
    oracle_address: address ?? '',
  };

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['myJobsInfinite', queryParams],
    queryFn: async ({ signal }) => {
      return jobsService.fetchMyJobs({ queryParams, signal });
    },
    getNextPageParam: (pageParams: MyJobPaginationResponse) => {
      return pageParams.total_pages - 1 <= pageParams.page
        ? undefined
        : pageParams.page;
    },
  });
}
