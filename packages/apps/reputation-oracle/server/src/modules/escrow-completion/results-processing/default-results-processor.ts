import { Injectable } from '@nestjs/common';

import { FortuneJobType } from '@/common/enums';
import {
  BaseFinalResult,
  FortuneManifest,
  MarketingManifest,
  VerificationResult,
} from '@/common/types';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

type DefaultResultsManifest = FortuneManifest | MarketingManifest;

@Injectable()
export class DefaultResultsProcessor extends BaseEscrowResultsProcessor<DefaultResultsManifest> {
  protected constructIntermediateResultsUrl(baseUrl: string): string {
    return baseUrl;
  }

  protected async assertResultsComplete(
    resultsFileContent: Buffer,
    manifest: DefaultResultsManifest,
  ): Promise<void> {
    let finalResults: BaseFinalResult[];
    try {
      finalResults = JSON.parse(resultsFileContent.toString());
    } catch {
      throw new Error('Failed to parse results data');
    }

    if (!Array.isArray(finalResults) || !finalResults.length) {
      throw new Error('No final results found');
    }

    if (manifest.jobType !== FortuneJobType.FORTUNE) {
      return;
    }

    const acceptedResults = finalResults.filter(
      (result) => result.verificationResult === VerificationResult.Accepted,
    );
    if (acceptedResults.length < manifest.submissionsRequired) {
      throw new Error('Not all required results have been sent');
    }
  }

  protected getFinalResultsFileName(hash: string): string {
    return `${hash}.json`;
  }
}
