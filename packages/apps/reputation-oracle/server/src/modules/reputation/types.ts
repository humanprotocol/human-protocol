import { ChainId } from '@human-protocol/sdk';

import { ReputationEntityType, ReputationLevel } from './constants';

export type ReputationData = {
  chainId: ChainId;
  address: string;
  level: ReputationLevel;
  role: ReputationEntityType;
};

export type ExclusiveReputationCriteria = {
  chainId: number;
  address: string;
  type: ReputationEntityType;
};
