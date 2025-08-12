import { faker } from '@faker-js/faker';

import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { ReputationEntityType } from '../constants';
import { ReputationEntity } from '../reputation.entity';

const REPUTATION_ENTITY_TYPES = Object.values(ReputationEntityType);
export function generateReputationEntityType(): ReputationEntityType {
  return faker.helpers.arrayElement(REPUTATION_ENTITY_TYPES);
}

export function generateRandomScorePoints(): number {
  return faker.number.int({ min: 1, max: 42 });
}

export function generateReputationEntity(score?: number): ReputationEntity {
  return {
    id: faker.number.int(),
    chainId: generateTestnetChainId(),
    address: faker.finance.ethereumAddress(),
    type: generateReputationEntityType(),
    reputationPoints: score || generateRandomScorePoints(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };
}
