import { faker } from '@faker-js/faker';

import { generateTestnetChainId } from '../../web3/fixtures';

import { EscrowCompletionStatus } from '../constants';
import { EscrowCompletionEntity } from '../escrow-completion.entity';
import { EscrowPayoutsBatchEntity } from '../escrow-payouts-batch.entity';

export function generateEscrowCompletion(
  status: EscrowCompletionStatus,
): EscrowCompletionEntity {
  return {
    id: faker.number.int(),
    chainId: generateTestnetChainId(),
    status,
    retriesCount: 0,
    waitUntil: new Date(),
    failureDetail: null,
    finalResultsUrl: null,
    finalResultsHash: null,
    escrowAddress: faker.finance.ethereumAddress(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}

export function generateEscrowPayoutsBatch(): EscrowPayoutsBatchEntity {
  return {
    id: faker.number.int(),
    escrowCompletionTrackingId: faker.number.int(),
    payouts: [],
    payoutsHash: '',
    txNonce: null,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
