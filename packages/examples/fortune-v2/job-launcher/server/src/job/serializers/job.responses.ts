import { JobMode, JobRequestType } from "../../common/enums/job";

export interface IManifestDto {
  chainId: number;
  escrowAddress?: string;
  dataUrl?: string;
  labels?: string[];
  submissionsRequired: number;
  requesterTitle?: string;
  requesterDescription: string;
  requesterAccuracyTarget?: number;
  price: number;
  requestType: JobRequestType;
  mode: JobMode;
}