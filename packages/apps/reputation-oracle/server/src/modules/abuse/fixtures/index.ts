import { faker } from '@faker-js/faker';
import { generateTestnetChainId } from '../../web3/fixtures';
import { AbuseStatus } from '../constants';
import { generateWorkerUser } from '../../user/fixtures';
import { AbuseEntity } from '../abuse.entity';

export function generateAbuseEntity(
  overrides?: Partial<AbuseEntity>,
): AbuseEntity {
  const user = overrides?.user || generateWorkerUser();

  const abuse: AbuseEntity = {
    id: faker.number.int(),
    escrowAddress: faker.finance.ethereumAddress(),
    chainId: generateTestnetChainId(),
    userId: user.id,
    user: user,
    retriesCount: faker.number.int({ min: 0, max: 4 }),
    status: AbuseStatus.PENDING,
    decision: null,
    amount: null,
    reason: faker.lorem.sentence(),
    waitUntil: faker.date.future(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
    ...overrides,
  };

  return abuse;
}
