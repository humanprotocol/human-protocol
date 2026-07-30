import {
  CvatJobType,
  FortuneJobType,
  JobType,
  MarketingJobType,
} from '@/common/enums';

export interface BaseManifest<
  TRequestType extends FortuneJobType | MarketingJobType,
> {
  submissionsRequired: number;
  requestType: TRequestType;
}

export type FortuneManifest = BaseManifest<FortuneJobType>;

export interface MarketingManifest extends BaseManifest<MarketingJobType> {
  endDate?: string;
}

export type CvatManifest = {
  version: 2;
  job_type: CvatJobType;
  // not necessary for RepO
  data: unknown;
  annotation: unknown;
};

export type JobManifest = FortuneManifest | MarketingManifest | CvatManifest;

export type JobRequestType = (typeof JobType)[number];
