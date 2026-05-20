import {
  CvatJobType,
  FortuneJobType,
  JobType,
  MarketingJobType,
} from '@/common/enums';

export interface BaseManifest<
  TJobType extends FortuneJobType | MarketingJobType,
> {
  submissionsRequired: number;
  jobType: TJobType;
}

export type FortuneManifest = BaseManifest<FortuneJobType>;

export interface MarketingManifest extends BaseManifest<MarketingJobType> {
  endDate?: string;
}

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

export type JobRequestType = (typeof JobType)[number];
