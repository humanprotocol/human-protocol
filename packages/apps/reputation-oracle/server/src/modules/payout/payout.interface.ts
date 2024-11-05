import { ChainId } from '@human-protocol/sdk';
import {
  CalculateResultsDto,
  CvatManifestDto,
  FortuneManifestDto,
} from '../../common/dto/manifest';
import { PayoutsDataDto, SaveResultDto } from '../../common/dto/result';

export interface RequestAction {
  calculateResults: (
    manifest: FortuneManifestDto | CvatManifestDto,
    data: CalculateResultsDto,
  ) => Promise<PayoutsDataDto>;
  saveResults: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifestDto,
  ) => Promise<SaveResultDto>;
}
