import { EscrowClient, EscrowUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import type { OverrideProperties } from 'type-fest';

import { AUDINO_VALIDATION_META_FILENAME } from '@/common/constants';
import { AudinoAnnotationMeta, AudinoManifest } from '@/common/types';

import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';

type CalculateAudinoPayoutsInput = OverrideProperties<
  CalclulatePayoutsInput,
  { manifest: AudinoManifest }
>;

@Injectable()
export class AudinoPayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    chainId,
    escrowAddress,
  }: CalculateAudinoPayoutsInput): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations =
      await this.storageService.downloadJsonLikeData<AudinoAnnotationMeta>(
        `${intermediateResultsUrl}/${AUDINO_VALIDATION_META_FILENAME}`,
      );

    if (annotations.jobs.length === 0 || annotations.results.length === 0) {
      throw new Error('Invalid annotation meta');
    }

    const escrowData = await EscrowUtils.getEscrow(chainId, escrowAddress);
    const jobBountyValue =
      BigInt(escrowData.totalFundedAmount) / BigInt(annotations.jobs.length);

    const workersBounties = new Map<string, bigint>();
    for (const job of annotations.jobs) {
      const jobFinalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
      if (jobFinalResult) {
        const workerAddress = jobFinalResult.annotator_wallet_address;

        const currentWorkerBounty = workersBounties.get(workerAddress) || 0n;

        workersBounties.set(
          workerAddress,
          currentWorkerBounty + jobBountyValue,
        );
      }
    }

    return Array.from(workersBounties.entries()).map(
      ([workerAddress, bountyAmount]) => ({
        address: workerAddress,
        amount: bountyAmount,
      }),
    );
  }
}
