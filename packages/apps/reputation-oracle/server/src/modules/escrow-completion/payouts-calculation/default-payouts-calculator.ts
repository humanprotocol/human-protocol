import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import {
  BaseFinalResult,
  FortuneManifest,
  MarketingManifest,
  VerificationResult,
} from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalculatedPayout,
  CalculatePayoutsInput,
  EscrowPayoutsCalculator,
} from './types';

type DefaultPayoutsManifest = FortuneManifest | MarketingManifest;

@Injectable()
export class DefaultPayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    manifest,
    chainId,
    escrowAddress,
    finalResultsUrl,
  }: CalculatePayoutsInput & {
    manifest: DefaultPayoutsManifest;
  }): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const finalResults =
      await this.storageService.downloadJsonLikeData<BaseFinalResult[]>(
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
    const payoutAmount = reservedFunds / BigInt(manifest.submissionsRequired);

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }
}
