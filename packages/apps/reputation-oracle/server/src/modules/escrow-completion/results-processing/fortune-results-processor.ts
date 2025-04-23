import { FortuneFinalResult } from '../../../common/interfaces/job-result';
import { FortuneManifest } from '../../../common/interfaces/manifest';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

export class FortuneResultsProcessor extends BaseEscrowResultsProcessor<FortuneManifest> {
  constructIntermediateResultsUrl(baseUrl: string): string {
    return baseUrl;
  }

  async assertResultsComplete(
    resultsFileContent: Buffer,
    manifest: FortuneManifest,
  ): Promise<void> {
    let intermediateResults: FortuneFinalResult[];
    try {
      intermediateResults = JSON.parse(resultsFileContent.toString());
    } catch (_error) {
      throw new Error('Failed to parse results data');
    }

    if (intermediateResults.length === 0) {
      throw new Error('No intermediate results found');
    }

    const validResults = intermediateResults.filter((result) => !result.error);
    if (validResults.length < manifest.submissionsRequired) {
      throw new Error('Not all required solutions have been sent');
    }
  }

  getFinalResultsFileName(hash: string): string {
    return `${hash}.json`;
  }
}
