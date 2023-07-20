import { JobMode, JobRequestType } from '../enums';

export interface IFortuneManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fee: string;
  fundAmount: string;
  requestType: JobRequestType;
  mode: JobMode;
}

export interface ICvatManifest {
  dataUrl: string;
  labels: string[];
  submissionsRequired: number;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  fee: string;
  fundAmount: string;
  requestType: JobRequestType;
  mode: JobMode;
}

export type Manifest = IFortuneManifest | ICvatManifest;
