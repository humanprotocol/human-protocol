import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import type { OverrideProperties } from 'type-fest';

import { AUDINO_RESULTS_ANNOTATIONS_FILENAME } from '../../../common/constants';
import { AudinoAnnotationMeta, AudinoManifest } from '../../../common/types';

import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';

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
    manifest,
    chainId,
    escrowAddress,
  }: CalculateAudinoPayoutsInput): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations =
      await this.storageService.downloadJsonLikeData<AudinoAnnotationMeta>(
        `${intermediateResultsUrl}/${AUDINO_RESULTS_ANNOTATIONS_FILENAME}`,
      );

    if (annotations.jobs.length === 0 || annotations.results.length === 0) {
      throw new Error('Invalid annotation meta');
    }

    const jobBountyValue = ethers.parseUnits(manifest.job_bounty, 18);
    const workersBounties = new Map<string, typeof jobBountyValue>();

    for (const job of annotations.jobs) {
      const jobFinalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
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
}
