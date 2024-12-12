import { ReputationLevel } from '../enums/reputation';

export const REPUTATION_RANK: Record<ReputationLevel, number> = {
  [ReputationLevel.LOW]: 1,
  [ReputationLevel.MEDIUM]: 2,
  [ReputationLevel.HIGH]: 3,
};
