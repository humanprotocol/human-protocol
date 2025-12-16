import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

async function getExchangeApiKeys(): Promise<{ apiKey: string }> {
  try {
    const response = await authorizedHumanAppApiClient.get<{ apiKey: string }>(
      '/exchange-api-keys'
    );
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to get exchange API keys');
  }
}

async function enrollExchangeApiKeys(data: {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}) {
  const { exchange, ...body } = data;
  try {
    const response = await authorizedHumanAppApiClient.post(
      `/exchange-api-keys/${exchange}`,
      {
        body,
      }
    );
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to enroll exchange API keys');
  }
}

async function deleteExchangeApiKeys(): Promise<void> {
  try {
    await authorizedHumanAppApiClient.delete('/exchange-api-keys');
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
  }
  throw new Error('Failed to delete exchange API keys');
}

export { enrollExchangeApiKeys, getExchangeApiKeys, deleteExchangeApiKeys };
