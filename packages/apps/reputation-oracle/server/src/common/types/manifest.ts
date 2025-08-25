import { AudinoJobType, CvatJobType, FortuneJobType } from '@/common/enums';

export type FortuneManifest = {
  submissionsRequired: number;
  fundAmount: number;
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

export type AudinoManifest = {
  annotation: {
    type: AudinoJobType;
  };
  validation: {
    min_quality: number;
  };
};

export type JobManifest = FortuneManifest | CvatManifest | AudinoManifest;

export type JobRequestType = FortuneJobType | CvatJobType | AudinoJobType;
