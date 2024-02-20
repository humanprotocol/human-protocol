import { ChainId } from '@human-protocol/sdk';

export interface RequestAction {
  assessWorkerReputationScores: (
    chainId: ChainId,
    escrowAddress: string,
  ) => Promise<void>;
}
