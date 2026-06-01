export enum VerificationResult {
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export class BaseFinalResult {
  workerAddress!: string;
  verificationResult!: VerificationResult;
  rejectionReason?: string;
}

export class FortuneFinalResult extends BaseFinalResult {
  solution!: string;
}

export class MarketingFinalResult extends BaseFinalResult {
  postUrl!: string;
}

type CvatAnnotationMetaJob = {
  job_id: number;
  final_result_id: number;
};

export type CvatAnnotationMetaResult = {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
};

export type CvatAnnotationMeta = {
  jobs: CvatAnnotationMetaJob[];
  results: CvatAnnotationMetaResult[];
};
