import useSWR from 'swr';
import * as jobService from '../services/job';
import { JobStatus } from '../types';

export const useJobs = (status: JobStatus) => {
  return useSWR(`human-protocol-${status}-jobs`, () =>
    jobService.getJobListByStatus(status)
  );
};
