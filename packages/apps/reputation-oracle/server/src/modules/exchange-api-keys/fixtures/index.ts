import { faker } from '@faker-js/faker';

import { generateExchangeName } from '@/modules/exchange/fixtures';

import { ExchangeApiKeyEntity } from '../exchange-api-key.entity';

export function generateExchangeApiKeysData() {
  return {
    userId: faker.number.int(),
    exchangeName: generateExchangeName(),
    apiKey: faker.string.sample(),
    secretKey: faker.string.sample(),
  };
}

export function generateExchangeApiKey(): ExchangeApiKeyEntity {
  const entity = {
    id: faker.number.int(),
    ...generateExchangeApiKeysData(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  return entity as ExchangeApiKeyEntity;
}
