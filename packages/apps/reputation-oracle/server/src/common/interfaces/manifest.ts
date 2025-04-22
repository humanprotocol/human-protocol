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

interface AudinoData {
  data_url: string;
}

interface AudinoLabel {
  name: string;
}

interface AudinoValidation {
  gt_url: string;
  min_quality: number;
}

interface AudinoAnnotation {
  type: JobRequestType;
  labels: AudinoLabel[];
  description: string;
  segment_duration: number;
}

export interface AudinoManifest {
  data: AudinoData;
  annotation: AudinoAnnotation;
  job_bounty: string;
  validation: AudinoValidation;
}

export type JobManifest = FortuneManifest | CvatManifest | AudinoManifest;
