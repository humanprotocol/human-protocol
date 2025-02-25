import { JobRequestType } from '../enums';

interface CvatData {
  data_url: string;
}

interface Label {
  name: string;
}

interface Annotation {
  labels: Label[];
  description: string;
  type: JobRequestType;
  job_size: number;
  max_time: number;
}

interface Validation {
  min_quality: number;
  val_size: number;
  gt_url: string;
}

export interface CvatManifest {
  data: CvatData;
  annotation: Annotation;
  validation: Validation;
  job_bounty: string;
}

export interface FortuneManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: number;
  requestType: JobRequestType;
}
