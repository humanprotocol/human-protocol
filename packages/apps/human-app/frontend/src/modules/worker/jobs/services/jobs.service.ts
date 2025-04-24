import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import {
  availableJobsSuccessResponseSchema,
  type MyJobPaginationResponse,
  myJobsSuccessResponseSchema,
} from '../schemas';
import {
  type AssignJobBody,
  type JobsBody,
  type RefreshJobsBody,
  type RejectTaskBody,
  type AvailableJobsSuccessResponse,
} from '../types';

const apiPaths = {
  jobs: '/jobs',
  myJobs: '/assignment/job',
  assignJob: '/assignment/job',
  resignJob: '/assignment/resign-job',
  refreshJobs: '/assignment/refresh',
  uiConfig: '/ui-config',
};

async function fetchAvailableJobs(args: JobsBody) {
  try {
    const result =
      await authorizedHumanAppApiClient.get<AvailableJobsSuccessResponse>(
        apiPaths.jobs,
        {
          queryParams: args.queryParams,
          successSchema: availableJobsSuccessResponseSchema,
          abortSignal: args.signal,
        }
      );

    return result;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to get available jobs');
  }
}

async function fetchMyJobs(args: JobsBody) {
  try {
    const result =
      await authorizedHumanAppApiClient.get<MyJobPaginationResponse>(
        apiPaths.myJobs,
        {
          queryParams: args.queryParams,
          successSchema: myJobsSuccessResponseSchema,
          abortSignal: args.signal,
        }
      );

    return result;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to get my jobs');
  }
}

async function assignJob(data: AssignJobBody) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.assignJob, {
      body: { ...data },
    });
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to assign job');
  }
}

async function resignJob(data: RejectTaskBody) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.resignJob, {
      body: { ...data },
    });
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to resign job');
  }
}

async function refreshJobs(data: RefreshJobsBody) {
  try {
    await authorizedHumanAppApiClient.put(apiPaths.refreshJobs, {
      body: { ...data },
    });
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to refresh jobs');
  }
}

export { fetchAvailableJobs, fetchMyJobs, assignJob, resignJob, refreshJobs };
