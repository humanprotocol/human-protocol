import { AudinoJobType, CvatJobType, FortuneJobType } from '../enums';

export type FortuneManifest = {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: number;
  requestType: FortuneJobType;
};

type CvatAnnotation = {
  labels: Array<{
    name: string;
  }>;
  description: string;
  type: CvatJobType;
  job_size: number;
  max_time: number;
};

type CvatValidation = {
  min_quality: number;
  val_size: number;
  gt_url: string;
};

export type CvatManifest = {
  data: {
    data_url: string;
  };
  annotation: CvatAnnotation;
  validation: CvatValidation;
  job_bounty: string;
};

type AudinoValidation = {
  gt_url: string;
  min_quality: number;
};

type AudinoAnnotation = {
  type: AudinoJobType;
  labels: Array<{
    name: string;
  }>;
  description: string;
  segment_duration: number;
};

export type AudinoManifest = {
  data: {
    data_url: string;
  };
  annotation: AudinoAnnotation;
  validation: AudinoValidation;
  job_bounty: string;
};

export type JobManifest = FortuneManifest | CvatManifest | AudinoManifest;

export type JobRequestType = FortuneJobType | CvatJobType | AudinoJobType;
