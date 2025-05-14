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

async function enableOperator(signature: string) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.enableOperator, {
      body: { signature },
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to enable operator');
  }
}

async function disableOperator(signature: string) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.disableOperator, {
      body: { signature },
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to disable operator');
  }
}

async function getStats(statsBaseUrl: string) {
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

export { enableOperator, disableOperator, getStats };
