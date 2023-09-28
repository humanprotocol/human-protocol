import { JobStatus } from '../../types';

export type UserJob = {
  address: string;
  fundAmount: number;
  jobId: number;
  network: string;
  status: JobStatus;
};

export type JobsState = {
  jobs: UserJob[];
  dataLoaded: boolean;
  loadingFailed: boolean;
};
