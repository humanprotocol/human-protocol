import { faker } from '@faker-js/faker';

import { generateTestnetChainId } from '../web3/fixtures';
import { IncomingWebhookStatus } from './types';
import { IncomingWebhookEntity } from './webhook-incoming.entity';

type GenerateIncomingWebhookOptions = {
  retriesCount?: number;
  status?: IncomingWebhookStatus;
  failureDetail?: string;
};

export function generateIncomingWebhook(
  options?: GenerateIncomingWebhookOptions,
): IncomingWebhookEntity {
  const retriesCount = options?.retriesCount || 0;
  const status = options?.status || IncomingWebhookStatus.PENDING;
  const failureDetail = options?.failureDetail || null;
  return {
    id: faker.number.int(),
    chainId: generateTestnetChainId(),
    escrowAddress: faker.finance.ethereumAddress(),
    retriesCount,
    waitUntil: faker.date.future(),
    status,
    failureDetail,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
