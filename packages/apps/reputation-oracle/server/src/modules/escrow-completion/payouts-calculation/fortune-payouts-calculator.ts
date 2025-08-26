import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import type { OverrideProperties } from 'type-fest';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';
import { FortuneFinalResult, FortuneManifest } from '../../../common/types';
import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';

type CalculateFortunePayoutsInput = OverrideProperties<
  CalclulatePayoutsInput,
  { manifest: FortuneManifest }
>;

@Injectable()
export class FortunePayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    chainId,
    escrowAddress,
    finalResultsUrl,
  }: CalculateFortunePayoutsInput): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const finalResults =
      await this.storageService.downloadJsonLikeData<FortuneFinalResult[]>(
        finalResultsUrl,
      );

    const recipients = finalResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);

    const reservedFunds = await escrowClient.getReservedFunds(escrowAddress);
    const recipientsAmount = BigInt(recipients.length);
    const payoutAmount = reservedFunds / recipientsAmount;
    const rest = reservedFunds % recipientsAmount;

    const payouts: CalculatedPayout[] = recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));

    // If division leaves a rest (due to truncation), the remaining amount
    // is sent to the job launcher so that no funds are stuck.
    if (rest > 0n) {
      const launcher = await escrowClient.getJobLauncherAddress(escrowAddress);
      payouts.push({ address: launcher, amount: rest });
    }

    return payouts;
  }
}
