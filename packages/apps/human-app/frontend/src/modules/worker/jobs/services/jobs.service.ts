import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';
import {
  availableJobsSuccessResponseSchema,
  type MyJobPaginationResponse,
  myJobsSuccessResponseSchema,
  uiConfigSchema,
} from '../schemas';
import { type AvailableJobsSuccessResponse, type UiConfig } from '../types';

export interface RejectTaskBody {
  assignment_id: string;
  oracle_address: string;
}

export interface JobsBody {
  queryParams?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface AssignJobBody {
  escrow_address: string;
  chain_id: number;
}

export interface RefreshJobsBody {
  oracle_address: string;
}

const apiPaths = {
  jobs: '/jobs',
  myJobs: '/assignment/job',
  assignJob: '/assignment/job',
  resignJob: '/assignment/resign-job',
  refreshJobs: '/assignment/refresh',
  uiConfig: '/ui-config',
};

export class JobsService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async fetchAvailableJobs(args: JobsBody) {
    try {
      const result =
        await this.authorizedHttpApiClient.get<AvailableJobsSuccessResponse>(
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
        await this.authorizedHttpApiClient.get<MyJobPaginationResponse>(
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
      const result = await this.authorizedHttpApiClient.post(
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
      const result = await this.authorizedHttpApiClient.post(
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
      const result = await this.authorizedHttpApiClient.put(
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
      const result = await this.authorizedHttpApiClient.get<UiConfig>(
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
