import { CvatJobType, FortuneJobType } from '@/common/enums';

export type FortuneManifest = {
  submissionsRequired: number;
  requestType: FortuneJobType;
};

export type CvatManifest = {
  annotation: {
    type: CvatJobType;
  };
  validation: {
    min_quality: number;
  };
  job_bounty: string;
};

export type JobManifest = FortuneManifest | CvatManifest;

export type JobRequestType = FortuneJobType | CvatJobType;
