import { authorizedHumanAppApiClient } from '@/api';

interface StakeSummary {
  exchangeStake: number;
  onChainStake: number;
  minThreshold: number;
}

interface ExchangeApiKey {
  apiKey: string;
  exchange: string;
}

// interface Exchange {
//   name: string;
//   displayName: string;
// }

async function getStakeSummary(): Promise<StakeSummary | null> {
  const response = await authorizedHumanAppApiClient.get<StakeSummary>(
    '/exchange-api-keys/stake'
  );
  return response || null;
}

async function getSupportedExchanges(): Promise<string[]> {
  const response = await authorizedHumanAppApiClient.get<string[]>(
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
  getStakeSummary,
};
