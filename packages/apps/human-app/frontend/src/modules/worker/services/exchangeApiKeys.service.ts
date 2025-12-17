import { authorizedHumanAppApiClient } from '@/api';

interface ExchangeApiKey {
  api_key: string;
  exchange_name: string;
}

interface Exchange {
  name: string;
  display_name: string;
}

async function getSupportedExchanges(): Promise<Exchange[]> {
  const response = await authorizedHumanAppApiClient.get<Exchange[]>(
    '/exchange-api-keys/supported-exchanges'
  );
  return response || [];
}

async function getExchangeApiKeys(): Promise<ExchangeApiKey> {
  const response =
    await authorizedHumanAppApiClient.get<ExchangeApiKey>('/exchange-api-keys');
  return response || null;
}

async function enrollExchangeApiKeys(data: {
  exchange: string;
  apiKey: string;
  secretKey: string;
}): Promise<void> {
  const { exchange, ...body } = data;
  await authorizedHumanAppApiClient.post(`/exchange-api-keys/${exchange}`, {
    body,
  });
}

async function deleteExchangeApiKeys(): Promise<void> {
  await authorizedHumanAppApiClient.delete('/exchange-api-keys');
}

export {
  enrollExchangeApiKeys,
  getExchangeApiKeys,
  deleteExchangeApiKeys,
  getSupportedExchanges,
};
