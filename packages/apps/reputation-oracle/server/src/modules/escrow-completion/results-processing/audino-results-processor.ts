import { AUDINO_RESULTS_ANNOTATIONS_FILENAME } from '../../../common/constants';
import { AudinoManifest } from '../../../common/interfaces/manifest';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

export class AudinoResultsProcessor extends BaseEscrowResultsProcessor<AudinoManifest> {
  constructIntermediateResultsUrl(baseUrl: string): string {
    return `${baseUrl}/${AUDINO_RESULTS_ANNOTATIONS_FILENAME}`;
  }

  async assertResultsComplete(): Promise<void> {
    return;
  }

  getFinalResultsFileName(hash: string): string {
    return `s3${hash}.zip`;
  }
}
