import { EscrowClient } from '@human-protocol/sdk';

import {
  BaseFinalResult,
  JobManifest,
  VerificationResult,
} from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';

export abstract class FinalResultsPayoutsCalculator<
  TFinalResult extends BaseFinalResult,
  TManifest extends JobManifest,
> implements EscrowPayoutsCalculator {
  protected constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    manifest,
    chainId,
    escrowAddress,
    finalResultsUrl,
  }: CalclulatePayoutsInput & { manifest: TManifest }): Promise<
    CalculatedPayout[]
  > {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const finalResults =
      await this.storageService.downloadJsonLikeData<TFinalResult[]>(
        finalResultsUrl,
      );

    const recipients = finalResults
      .filter(
        (result) => result.verificationResult === VerificationResult.Accepted,
      )
      .map((item) => item.workerAddress);

    if (!recipients.length) {
      return [];
    }

    const reservedFunds = await escrowClient.getReservedFunds(escrowAddress);
    const payoutAmount =
      reservedFunds / BigInt(this.getPayoutDivisor(manifest, recipients));

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }

  protected abstract getPayoutDivisor(
    manifest: TManifest,
    recipients: string[],
  ): number;
}
