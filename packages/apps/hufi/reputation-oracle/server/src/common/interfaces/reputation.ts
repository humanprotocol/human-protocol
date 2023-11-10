import { ReputationLevel } from '../enums/reputation';

export interface IReputation {
  chainId: number;
  address: string;
  reputation: ReputationLevel;
}
