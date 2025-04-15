import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';
import { type OperatorStatsSuccessResponse } from '../types';
import { operatorStatsSuccessResponseSchema } from '../schemas';

const apiPaths = {
  enableOperator: '/enable-operator',
  disableOperator: '/disable-operator',
  stats: '/stats',
};

export class OperatorProfileService {
  private readonly httpApiClient: HttpApiClient;
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;
  private readonly authService: AuthService;

  constructor() {
    this.httpApiClient = new HttpApiClient(env.VITE_API_URL);
    this.authService = new AuthService(this.httpApiClient);

    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      this.authService
    );
  }

  async enableOperator(data: { signature: string }) {
    try {
      const result = await this.authorizedHttpApiClient.post<null>(
        apiPaths.enableOperator,
        {
          body: data,
        }
      );

      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to enable operator');
    }
  }

  async disableOperator(data: { signature: string }) {
    try {
      const result = await this.authorizedHttpApiClient.post(
        apiPaths.disableOperator,
        {
          body: data,
        }
      );

      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to disable operator');
    }
  }

  async getStats(statsBaseUrl: string) {
    try {
      const result = await this.httpApiClient.get<OperatorStatsSuccessResponse>(
        apiPaths.stats,
        {
          baseUrl: statsBaseUrl,
          successSchema: operatorStatsSuccessResponseSchema,
        }
      );

      return result;
    } catch (error) {
      throw new Error('Failed to get stats');
    }
  }

  async refreshAccessToken() {
    await this.authService.refreshAccessToken();
  }
}

export const operatorProfileService = new OperatorProfileService();
