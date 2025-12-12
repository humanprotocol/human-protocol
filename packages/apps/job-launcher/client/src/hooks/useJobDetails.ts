import useSWR from 'swr';
import * as jobService from '../services/job';
import { JobDetailsResults } from '../types';

export const useJobDetails = (jobId: number) => {
  return useSWR(`human-protocol-job-${jobId}`, async () => {
    const job = await jobService.getJobDetails(jobId);
    const jobData: JobDetailsResults = job;
    try {
      const results = await jobService.getJobResult(jobId);
      jobData.results = results;
    } catch {
      // No results found
    }
    return jobData;
  });
};
