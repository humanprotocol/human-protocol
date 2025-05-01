import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';

import { generateTestnetChainId } from '../web3/fixtures';
import {
  IncomingWebhookStatus,
  OutgoingWebhookEventType,
  OutgoingWebhookStatus,
} from './types';
import { IncomingWebhookEntity } from './webhook-incoming.entity';
import { OutgoingWebhookEntity } from './webhook-outgoing.entity';

type GenerateIncomingWebhookOptions = {
  retriesCount?: number;
  status?: IncomingWebhookStatus;
};

type GenerateOutgoingWebhookPayloadOptions = {
  escrowAddress?: string;
};

type GenerateOutgoingWebhookOptions = {
  retriesCount?: number;
  status?: OutgoingWebhookStatus;
};

export function generateIncomingWebhook(
  options?: GenerateIncomingWebhookOptions,
): IncomingWebhookEntity {
  const retriesCount = options?.retriesCount || 0;
  const status = options?.status || IncomingWebhookStatus.PENDING;
  return {
    id: faker.number.int(),
    chainId: generateTestnetChainId(),
    escrowAddress: faker.finance.ethereumAddress(),
    retriesCount,
    waitUntil: faker.date.future(),
    status,
    failureDetail: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}

export function generateOutgoingWebhookPayload(
  options?: GenerateOutgoingWebhookPayloadOptions,
): Record<string, unknown> {
  const escrowAddress =
    options?.escrowAddress || faker.finance.ethereumAddress();

  return {
    chainId: generateTestnetChainId(),
    eventType: OutgoingWebhookEventType.ESCROW_COMPLETED,
    escrowAddress,
  };
}

export function generateOutgoingWebhook(
  options?: GenerateOutgoingWebhookOptions,
): OutgoingWebhookEntity {
  const retriesCount = options?.retriesCount || 0;
  const status = options?.status || OutgoingWebhookStatus.PENDING;

  const payload = generateOutgoingWebhookPayload();
  const url = faker.internet.url();
  const hash = crypto
    .createHash('sha256')
    .update(stringify({ payload, url }) as string)
    .digest('hex');

  return {
    id: faker.number.int(),
    payload,
    hash,
    url,
    retriesCount,
    waitUntil: faker.date.future(),
    status,
    failureDetail: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
