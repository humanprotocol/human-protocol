import { ChainId } from '@human-protocol/sdk';
import {
  CalculatePayoutsDto,
  CvatManifestDto,
  FortuneManifestDto,
} from '../../common/dto/manifest';

export class SaveResultDto {
  /**
   * URL to the stored results.
   */
  url: string;

  /**
   * Hash of the stored results.
   */
  hash: string;
}

export type CalculatedPayout = {
  address: string;
  amount: bigint;
};

export interface RequestAction {
  calculatePayouts: (
    manifest: FortuneManifestDto | CvatManifestDto,
    data: CalculatePayoutsDto,
  ) => Promise<CalculatedPayout[]>;
  saveResults: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifestDto,
  ) => Promise<SaveResultDto>;
}
