import { Injectable } from '@nestjs/common';

import { FortuneFinalResult, FortuneManifest } from '@/common/types';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

@Injectable()
export class FortuneResultsProcessor extends BaseEscrowResultsProcessor<FortuneManifest> {
  protected constructIntermediateResultsUrl(baseUrl: string): string {
    return baseUrl;
  }

  protected async assertResultsComplete(
    resultsFileContent: Buffer,
    manifest: FortuneManifest,
  ): Promise<void> {
    let intermediateResults: FortuneFinalResult[];
    try {
      intermediateResults = JSON.parse(resultsFileContent.toString());
    } catch (_error) {
      throw new Error('Failed to parse results data');
    }

    if (!intermediateResults.length) {
      throw new Error('No intermediate results found');
    }

    const validResults = intermediateResults.filter((result) => !result.error);
    if (validResults.length < manifest.submissionsRequired) {
      throw new Error('Not all required solutions have been sent');
    }
  }

  protected getFinalResultsFileName(hash: string): string {
    return `${hash}.json`;
  }
}
