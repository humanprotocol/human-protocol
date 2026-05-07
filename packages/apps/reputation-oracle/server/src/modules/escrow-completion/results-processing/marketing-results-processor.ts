import { Injectable } from '@nestjs/common';

import { MarketingFinalResult, MarketingManifest } from '@/common/types';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

@Injectable()
export class MarketingResultsProcessor extends BaseEscrowResultsProcessor<MarketingManifest> {
  protected constructIntermediateResultsUrl(baseUrl: string): string {
    return baseUrl;
  }

  protected async assertResultsComplete(
    resultsFileContent: Buffer,
    _manifest: MarketingManifest,
  ): Promise<void> {
    let finalResults: MarketingFinalResult[];
    try {
      finalResults = JSON.parse(resultsFileContent.toString());
    } catch {
      throw new Error('Failed to parse results data');
    }

    if (!Array.isArray(finalResults) || !finalResults.length) {
      throw new Error('No final results found');
    }
  }

  protected getFinalResultsFileName(hash: string): string {
    return `${hash}.json`;
  }
}
