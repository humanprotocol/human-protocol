import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import type { OverrideProperties } from 'type-fest';

import { FortuneFinalResult, FortuneManifest } from '../../../common/types';

import { StorageService } from '../../storage';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';

type CalculateFortunePayoutsInput = OverrideProperties<
  CalclulatePayoutsInput,
  { manifest: FortuneManifest }
>;

@Injectable()
export class FortunePayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(private readonly storageService: StorageService) {}

  async calculate({
    manifest,
    finalResultsUrl,
  }: CalculateFortunePayoutsInput): Promise<CalculatedPayout[]> {
    const finalResults =
      await this.storageService.downloadJsonLikeData<FortuneFinalResult[]>(
        finalResultsUrl,
      );

    const recipients = finalResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);

    const payoutAmount =
      ethers.parseUnits(manifest.fundAmount.toString(), 18) /
      BigInt(recipients.length);

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }
}
