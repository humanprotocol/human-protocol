import { ChainId } from '@human-protocol/sdk';
import useSWR from 'swr';
import * as jobService from '../services/job';
import { JobStatus } from '../types';

export const useJobs = ({
  chainId,
  status,
}: {
  chainId?: ChainId;
  status?: JobStatus;
}) => {
  return useSWR(`human-protocol-jobs-${chainId}-${status}`, async () => {
    try {
      const jobs = await jobService.getJobList({ chainId, status });
      return jobs;
    } catch (err) {
      return [];
    }
  });
};
