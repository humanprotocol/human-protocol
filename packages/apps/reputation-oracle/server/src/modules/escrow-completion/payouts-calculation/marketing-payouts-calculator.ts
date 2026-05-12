import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import type { OverrideProperties } from 'type-fest';

import {
  MarketingFinalResult,
  MarketingManifest,
  VerificationResult,
} from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';

type CalculateMarketingPayoutsInput = OverrideProperties<
  CalclulatePayoutsInput,
  { manifest: MarketingManifest }
>;

@Injectable()
export class MarketingPayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    manifest,
    chainId,
    escrowAddress,
    finalResultsUrl,
  }: CalculateMarketingPayoutsInput): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const finalResults =
      await this.storageService.downloadJsonLikeData<MarketingFinalResult[]>(
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
    const payoutAmount = reservedFunds / BigInt(manifest.submissions_required);

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }
}
