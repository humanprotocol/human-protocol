import { ChainId } from '@human-protocol/sdk';
import {
  CalculatePayoutsDto,
  CvatManifestDto,
  FortuneManifestDto,
} from '../../common/dto/manifest';
import { PayoutsDataDto, SaveResultDto } from '../../common/dto/result';

export interface RequestAction {
  calculatePayouts: (
    manifest: FortuneManifestDto | CvatManifestDto,
    data: CalculatePayoutsDto,
  ) => Promise<PayoutsDataDto>;
  saveResults: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifestDto,
  ) => Promise<SaveResultDto>;
}
