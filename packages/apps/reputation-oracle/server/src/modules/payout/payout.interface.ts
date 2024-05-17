import { ChainId } from '@human-protocol/sdk';
import { CvatManifestDto, FortuneManifestDto } from '../../common/dto/manifest';
import { ProcessingResultDto } from '../../common/dto/result';

export interface RequestAction {
  calculateResults: (
    manifest: FortuneManifestDto | CvatManifestDto,
    chainId: ChainId,
    escrowAddress: string,
  ) => Promise<ProcessingResultDto>;
}
