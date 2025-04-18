import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import {
  availableJobsSuccessResponseSchema,
  type MyJobPaginationResponse,
  myJobsSuccessResponseSchema,
  uiConfigSchema,
} from '../schemas';
import {
  type AssignJobBody,
  type JobsBody,
  type RefreshJobsBody,
  type RejectTaskBody,
  type AvailableJobsSuccessResponse,
  type UiConfig,
} from '../types';

const apiPaths = {
  jobs: '/jobs',
  myJobs: '/assignment/job',
  assignJob: '/assignment/job',
  resignJob: '/assignment/resign-job',
  refreshJobs: '/assignment/refresh',
  uiConfig: '/ui-config',
};

export class JobsService {
  async fetchAvailableJobs(args: JobsBody) {
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

  async fetchMyJobs(args: JobsBody) {
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

  async assignJob(data: AssignJobBody) {
    try {
      const result = await authorizedHumanAppApiClient.post(
        apiPaths.assignJob,
        {
          body: { ...data },
        }
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to assign job');
    }
  }

  async resignJob(data: RejectTaskBody) {
    try {
      const result = await authorizedHumanAppApiClient.post(
        apiPaths.resignJob,
        {
          body: { ...data },
        }
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to resign job');
    }
  }

  async refreshJobs(data: RefreshJobsBody) {
    try {
      const result = await authorizedHumanAppApiClient.put(
        apiPaths.refreshJobs,
        {
          body: { ...data },
        }
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to refresh jobs');
    }
  }

  async getUiConfig() {
    try {
      const result = await authorizedHumanAppApiClient.get<UiConfig>(
        apiPaths.uiConfig,
        {
          successSchema: uiConfigSchema,
        }
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to get UI config');
    }
  }
}

export const jobsService = new JobsService();
