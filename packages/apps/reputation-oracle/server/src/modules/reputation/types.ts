import { ChainId } from '@human-protocol/sdk';

import { JobRequestType } from '@/common/types';

import { ReputationEntityType, ReputationLevel } from './constants';

export type ReputationData = {
  chainId: ChainId;
  address: string;
  level: ReputationLevel;
  role: ReputationEntityType;
  jobRequestType: JobRequestType;
};

export type ExclusiveReputationCriteria = {
  chainId: number;
  address: string;
  type: ReputationEntityType;
  jobRequestType: JobRequestType;
};
