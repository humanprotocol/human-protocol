import { SolutionError } from '../../common/enums';

export interface FortuneFinalResult {
  workerAddress: string;
  solution: string;
  error?: SolutionError;
}

interface CvatAnnotationMetaJobs {
  job_id: number;
  final_result_id: number;
}

export interface CvatAnnotationMetaResults {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
}

export interface CvatAnnotationMeta {
  jobs: CvatAnnotationMetaJobs[];
  results: CvatAnnotationMetaResults[];
}
