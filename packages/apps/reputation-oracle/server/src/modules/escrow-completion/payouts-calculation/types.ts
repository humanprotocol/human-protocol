import { ChainId } from '@human-protocol/sdk';
import { JobManifest } from '../../../common/interfaces/manifest';

export type CalculatedPayout = {
  address: string;
  amount: bigint;
};

export type CalclulatePayoutsInput = {
  manifest: JobManifest;
  chainId: ChainId;
  escrowAddress: string;
  finalResultsUrl: string;
};

export interface EscrowPayoutsCalculator {
  calculate(input: CalclulatePayoutsInput): Promise<CalculatedPayout[]>;
}
