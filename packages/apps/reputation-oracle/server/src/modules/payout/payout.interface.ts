import { ChainId } from '@human-protocol/sdk';
import { CvatManifestDto, FortuneManifestDto } from 'src/common/dto/manifest';
import { ProcessingResultDto } from 'src/common/dto/result';

export interface RequestAction {
  calculateResults: (
    manifest: FortuneManifestDto | CvatManifestDto,
    chainId: ChainId,
    escrowAddress: string,
  ) => Promise<ProcessingResultDto>;
}
