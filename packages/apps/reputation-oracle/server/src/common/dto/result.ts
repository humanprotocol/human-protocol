import { SolutionError } from '../../common/enums';

export class ProcessingResultDto {
  /**
   * List of recipient addresses.
   */
  recipients: string[];

  /**
   * Corresponding amounts to be paid out to recipients.
   */
  amounts: bigint[];

  /**
   * URL to the stored results.
   */
  url: string;

  /**
   * Hash of the stored results.
   */
  hash: string;
}

export class FortuneFinalResult {
  workerAddress: string;
  solution: string;
  error?: SolutionError;
}

export class ImageLabelBinaryJobResults {
  dataset: Dataset<ImageLabelBinaryResult>;
  worker_performance: WorkerPerformanceResult[];
}
export class CvatAnnotationMetaJobs {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
}

export class CvatAnnotationMetaResults {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
}

export class CvatAnnotationMeta {
  jobs: CvatAnnotationMetaJobs[];
  results: CvatAnnotationMetaResults[];
}

class Dataset<T> {
  dataset_scores: { [score_name: string]: AgreementEstimate };
  data_points: T[];
}

class AgreementEstimate {
  score: number;
  interval?: [number, number];
  alpha?: number;
}

class ImageLabelBinaryResult {
  url: string;
  label: string;
  label_counts: { [label: string]: number };
  score: number;
}

class WorkerPerformanceResult {
  worker_id: string;
  consensus_annotations: number;
  total_annotations: number;
  score: number;
}
