import { Injectable } from '@nestjs/common';
import type { OverrideProperties } from 'type-fest';

import { FortuneFinalResult, FortuneManifest } from '../../../common/types';

import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';

import { EscrowClient } from '@human-protocol/sdk';
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

    const remainingFunds = await escrowClient.getReservedFunds(escrowAddress);
    const payoutAmount = remainingFunds / BigInt(recipients.length);

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }
}
