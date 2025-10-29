export function generateGateAccountBalance(tokens: string[] = []) {
  if (tokens.length === 0) {
    throw new Error('At least one token must be specified');
  }
  return tokens.map((token) => ({
    currency: token,
    available: faker.finance.amount(),
    locked: faker.finance.amount(),
    freeze: faker.finance.amount(),
  }));
}
export function generateMexcAccountBalance(tokens: string[] = []) {
  if (tokens.length === 0) {
    throw new Error('At least one token must be specified');
  }
  return {
    balances: tokens.map((token) => ({
      asset: token,
      free: faker.finance.amount(),
      locked: faker.finance.amount(),
    })),
  };
}
import { faker } from '@faker-js/faker';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';

export function generateExchangeName() {
  return faker.helpers.arrayElement(SUPPORTED_EXCHANGE_NAMES);
}
