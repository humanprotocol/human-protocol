import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import type { OverrideProperties } from 'type-fest';

import { CVAT_VALIDATION_META_FILENAME } from '@/common/constants';
import { CvatAnnotationMeta, CvatManifest } from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalclulatePayoutsInput,
  CalculatedPayout,
  EscrowPayoutsCalculator,
} from './types';

type CalculateCvatPayoutsInput = OverrideProperties<
  CalclulatePayoutsInput,
  { manifest: CvatManifest }
>;

@Injectable()
export class CvatPayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
    manifest,
    chainId,
    escrowAddress,
  }: CalculateCvatPayoutsInput): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations =
      await this.storageService.downloadJsonLikeData<CvatAnnotationMeta>(
        `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
      );

    if (!annotations.jobs.length || !annotations.results.length) {
      throw new Error('Invalid annotation meta');
    }

    const tokenAddress = await escrowClient.getTokenAddress(escrowAddress);
    const tokenDecimals = await this.web3Service.getTokenDecimals(
      chainId,
      tokenAddress,
    );
    const jobBountyValue = this.parseJobBounty(
      manifest.job_bounty,
      tokenDecimals,
    );
    const workersBounties = new Map<string, bigint>();

    for (const job of annotations.jobs) {
      const jobFinalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
      // TODO: enable annotation quality validation when ready
      if (
        jobFinalResult
        // && jobFinalResult.annotation_quality >= manifest.validation.min_quality
      ) {
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

  private parseJobBounty(jobBounty: string, tokenDecimals: bigint): bigint {
    const parts = jobBounty.split('.');
    if (parts.length > 1) {
      const decimalsInBounty = parts[1].length;
      if (decimalsInBounty > tokenDecimals) {
        throw new Error(
          `Job bounty value ${jobBounty} exceeds maximum token decimals (${tokenDecimals}).`,
        );
      }
    }
    return ethers.parseUnits(jobBounty, tokenDecimals);
  }
}
