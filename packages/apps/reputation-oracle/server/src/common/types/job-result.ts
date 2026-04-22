export type FortuneFinalResult = {
  workerAddress: string;
  solution: string;
  error?: 'duplicated' | 'curse_word';
};

export enum MarketingDecisionStatus {
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export type MarketingFinalResult = {
  workerAddress: string;
  postUrl: string;
  status: MarketingDecisionStatus;
  rejectionReason?: string;
};

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
