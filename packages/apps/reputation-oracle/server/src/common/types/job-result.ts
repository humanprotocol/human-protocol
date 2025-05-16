export type FortuneFinalResult = {
  workerAddress: string;
  solution: string;
  error?: 'duplicated' | 'curse_word';
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

type AudinoAnnotationMetaJob = {
  job_id: number;
  final_result_id: number;
};

export type AudinoAnnotationMetaResult = {
  id: number;
  job_id: number;
  annotator_wallet_address: string;
  annotation_quality: number;
};

export type AudinoAnnotationMeta = {
  jobs: AudinoAnnotationMetaJob[];
  results: AudinoAnnotationMetaResult[];
};
