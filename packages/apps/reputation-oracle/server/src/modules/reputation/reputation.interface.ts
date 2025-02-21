import { ChainId } from '@human-protocol/sdk';
import {
  CvatManifest,
  FortuneManifest,
} from '../../common/interfaces/manifest';

export interface RequestAction {
  assessWorkerReputationScores: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifest | CvatManifest,
  ) => Promise<void>;
}
