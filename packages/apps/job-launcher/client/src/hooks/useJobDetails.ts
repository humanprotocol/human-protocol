import useSWR from 'swr';
import * as jobService from '../services/job';

export const useJobDetails = (jobId: number) => {
  return useSWR(`human-protocol-job-${jobId}`, async () => {
    const job = await jobService.getJobDetails(jobId);
    return job;
  });
};
