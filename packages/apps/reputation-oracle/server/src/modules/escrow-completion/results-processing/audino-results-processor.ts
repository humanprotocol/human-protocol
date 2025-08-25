import { Injectable } from '@nestjs/common';

import { AUDINO_RESULTS_ANNOTATIONS_FILENAME } from '@/common/constants';
import { AudinoManifest } from '@/common/types';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

@Injectable()
export class AudinoResultsProcessor extends BaseEscrowResultsProcessor<AudinoManifest> {
  constructIntermediateResultsUrl(baseUrl: string): string {
    return `${baseUrl}/${AUDINO_RESULTS_ANNOTATIONS_FILENAME}`;
  }

  async assertResultsComplete(): Promise<void> {
    return;
  }

  getFinalResultsFileName(hash: string): string {
    return `${hash}.zip`;
  }
}
