import { Injectable } from '@nestjs/common';

import { CVAT_RESULTS_ANNOTATIONS_FILENAME } from '../../../common/constants';
import { CvatManifest } from '../../../common/types';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

@Injectable()
export class CvatResultsProcessor extends BaseEscrowResultsProcessor<CvatManifest> {
  constructIntermediateResultsUrl(baseUrl: string): string {
    return `${baseUrl}/${CVAT_RESULTS_ANNOTATIONS_FILENAME}`;
  }

  async assertResultsComplete(): Promise<void> {
    return;
  }

  getFinalResultsFileName(hash: string): string {
    return `${hash}.zip`;
  }
}
