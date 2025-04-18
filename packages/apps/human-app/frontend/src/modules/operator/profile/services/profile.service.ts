import {
  ApiClientError,
  authorizedHumanAppApiClient,
  HttpApiClient,
} from '@/api';
import { type OperatorStatsSuccessResponse } from '../types';
import { operatorStatsSuccessResponseSchema } from '../schemas';

const apiPaths = {
  enableOperator: '/enable-operator',
  disableOperator: '/disable-operator',
  stats: '/stats',
};

export class OperatorProfileService {
  async enableOperator(signature: string) {
    try {
      const result = await authorizedHumanAppApiClient.post<null>(
        apiPaths.enableOperator,
        {
          body: { signature },
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

  async disableOperator(signature: string) {
    try {
      const result = await authorizedHumanAppApiClient.post(
        apiPaths.disableOperator,
        {
          body: { signature },
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
    const httpClient = new HttpApiClient(statsBaseUrl);

    try {
      const result = await httpClient.get<OperatorStatsSuccessResponse>(
        apiPaths.stats,
        {
          successSchema: operatorStatsSuccessResponseSchema,
        }
      );

      return result;
    } catch (error) {
      throw new Error('Failed to get stats');
    }
  }
}

export const operatorProfileService = new OperatorProfileService();
