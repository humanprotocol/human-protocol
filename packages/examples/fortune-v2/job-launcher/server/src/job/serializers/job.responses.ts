import { JobMode, JobRequestType, JobStatus } from "../../common/decorators";
import { JobEntity } from "../job.entity";

export interface IManifestDto {
  chainId: number;
  escrowAddress: string;
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

export const manifestFormatter = (jobEntity: JobEntity): IManifestDto => {
  return {
    ...jobEntity,
    chainId: jobEntity.chainId,
    escrowAddress: jobEntity.escrowAddress,
    submissionsRequired: jobEntity.submissionsRequired,
    requesterDescription: jobEntity.requesterDescription,
    price: jobEntity.price,
    mode: jobEntity.mode,
    requestType: jobEntity.requestType,
  };
};
