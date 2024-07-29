import { ChainId } from '@human-protocol/sdk';
import useSWR from 'swr';
import * as jobService from '../services/job';
import { JobStatus } from '../types';

export const useJobs = ({
  chainId,
  status,
  page,
  pageSize,
}: {
  chainId?: ChainId;
  status?: JobStatus;
  page?: number;
  pageSize?: number;
}) => {
  return useSWR(
    `human-protocol-jobs-${chainId}-${status}-${page}-${pageSize}`,
    async () => {
      try {
        const jobs = await jobService.getJobList({
          chainId,
          status,
          page,
          pageSize,
        });
        return jobs;
      } catch (err) {
        return [];
      }
    },
  );
};
