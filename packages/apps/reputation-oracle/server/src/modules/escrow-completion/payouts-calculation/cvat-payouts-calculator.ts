import { EscrowClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import type { OverrideProperties } from 'type-fest';

import { CVAT_VALIDATION_META_FILENAME } from '@/common/constants';
import { CvatAnnotationMeta, CvatManifest } from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  CalculatedPayout,
  CalculatePayoutsInput,
  EscrowPayoutsCalculator,
} from './types';

type CalculateCvatPayoutsInput = OverrideProperties<
  CalculatePayoutsInput,
  { manifest: CvatManifest }
>;

@Injectable()
export class CvatPayoutsCalculator implements EscrowPayoutsCalculator {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  async calculate({
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

    const reservedFunds = await escrowClient.getReservedFunds(escrowAddress);

    const matchedJobResults = annotations.jobs
      .map((job) =>
        annotations.results.find((result) => result.id === job.final_result_id),
      )
      .filter((result): result is CvatAnnotationMeta['results'][number] =>
        Boolean(result),
      );

    if (!matchedJobResults.length) {
      throw new Error('Invalid annotation meta');
    }

    const jobBountyValue = reservedFunds / BigInt(matchedJobResults.length);
    const workersBounties = new Map<string, bigint>();

    for (const jobFinalResult of matchedJobResults) {
      // TODO: enable annotation quality validation when ready
      const workerAddress = jobFinalResult.annotator_wallet_address;

      const currentWorkerBounty = workersBounties.get(workerAddress) || 0n;

      workersBounties.set(workerAddress, currentWorkerBounty + jobBountyValue);
    }

    return Array.from(workersBounties.entries()).map(
      ([workerAddress, bountyAmount]) => ({
        address: workerAddress,
        amount: bountyAmount,
      }),
    );
  }
}
