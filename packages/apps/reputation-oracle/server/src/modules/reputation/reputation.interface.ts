import { ChainId } from '@human-protocol/sdk';
import { CvatManifestDto, FortuneManifestDto } from 'src/common/dto/manifest';

export interface RequestAction {
  assessWorkerReputationScores: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifestDto | CvatManifestDto,
  ) => Promise<void>;
}
