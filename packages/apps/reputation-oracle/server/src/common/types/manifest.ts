import { JobRequestType } from '../enums';

type CvatData = {
  data_url: string;
};

type Label = {
  name: string;
};

type Annotation = {
  labels: Label[];
  description: string;
  type: JobRequestType;
  job_size: number;
  max_time: number;
};

type Validation = {
  min_quality: number;
  val_size: number;
  gt_url: string;
};

export type CvatManifest = {
  data: CvatData;
  annotation: Annotation;
  validation: Validation;
  job_bounty: string;
};

export type FortuneManifest = {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: number;
  requestType: JobRequestType;
};

type AudinoData = {
  data_url: string;
};

type AudinoLabel = {
  name: string;
};

type AudinoValidation = {
  gt_url: string;
  min_quality: number;
};

type AudinoAnnotation = {
  type: JobRequestType;
  labels: AudinoLabel[];
  description: string;
  segment_duration: number;
};

export type AudinoManifest = {
  data: AudinoData;
  annotation: AudinoAnnotation;
  job_bounty: string;
  validation: AudinoValidation;
};

export type JobManifest = FortuneManifest | CvatManifest | AudinoManifest;
