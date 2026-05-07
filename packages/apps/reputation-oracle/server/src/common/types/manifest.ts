import { CvatJobType, FortuneJobType, MarketingJobType } from '@/common/enums';

export type FortuneManifest = {
  submissionsRequired: number;
  fundAmount: number;
  requestType: FortuneJobType;
};

export type MarketingManifest = {
  job_type: MarketingJobType;
  submissions_required: number;
  end_date?: string;
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

export type JobManifest = FortuneManifest | MarketingManifest | CvatManifest;

export type JobRequestType = FortuneJobType | MarketingJobType | CvatJobType;
