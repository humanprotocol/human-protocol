import { ChainId } from '@human-protocol/sdk';
import {
  CvatManifest,
  FortuneManifest,
} from '../../common/interfaces/manifest';

export class CalculatePayoutsInput {
  chainId: ChainId;

  escrowAddress: string;

  finalResultsUrl: string;
}

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
    manifest: FortuneManifest | CvatManifest,
    data: CalculatePayoutsInput,
  ) => Promise<CalculatedPayout[]>;
  saveResults: (
    chainId: ChainId,
    escrowAddress: string,
    manifest?: FortuneManifest,
  ) => Promise<SaveResultDto>;
}
