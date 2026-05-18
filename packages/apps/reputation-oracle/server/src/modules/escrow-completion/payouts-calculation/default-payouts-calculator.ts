import { Injectable } from '@nestjs/common';

import {
  BaseFinalResult,
  FortuneManifest,
  MarketingManifest,
} from '@/common/types';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import { FinalResultsPayoutsCalculator } from './final-results-payouts-calculator';

type DefaultPayoutsManifest = FortuneManifest | MarketingManifest;

@Injectable()
export class DefaultPayoutsCalculator extends FinalResultsPayoutsCalculator<
  BaseFinalResult,
  DefaultPayoutsManifest
> {
  constructor(storageService: StorageService, web3Service: Web3Service) {
    super(storageService, web3Service);
  }

  protected getPayoutDivisor(manifest: DefaultPayoutsManifest): number {
    return manifest.submissionsRequired;
  }
}
