import { JobMode, JobRequestType, JobStatus } from "../../common/decorators";
import { JobEntity } from "../job.entity";

export interface IJobDto extends IManifestDto {
  id: number;
  networkId: string;
  status: JobStatus;
  recordingOracleAddress: string;
  reputationOracleAddress: string;
  exchangeOracleAddress: string;
  recordingOracleUrl: string;
  reputationOracleUrl: string;
  exchangeOracleUrl: string;
}

export interface IManifestDto {
  dataUrl: string;
  data: IManifestDataItemDto[];
  datasetLength: number;
  manifestHash: string;
  labels: string[];
  annotationsPerImage: number;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
  requestType: JobRequestType;
  mode: JobMode;
  tokenAddress: string;
  escrowAddress: string;
}

export interface IManifestDataItemDto {
  datapointUri: string;
}

export const manifestFormatter = (jobEntity: JobEntity): IManifestDto => {
  return {
    dataUrl: jobEntity.dataUrl,
    data: JSON.parse(jobEntity.data) as IManifestDataItemDto[],
    manifestHash: jobEntity.manifestHash,
    datasetLength: jobEntity.datasetLength,
    annotationsPerImage: jobEntity.annotationsPerImage,
    labels: jobEntity.labels,
    requesterDescription: jobEntity.requesterDescription,
    requesterAccuracyTarget: jobEntity.requesterAccuracyTarget,
    tokenAddress: jobEntity.tokenAddress,
    price: jobEntity.price,
    mode: jobEntity.mode,
    requestType: jobEntity.requestType,
    escrowAddress: jobEntity.escrowAddress,
  };
};

export const jobFormatter = (jobEntity: JobEntity): IJobDto => {
  return {
    id: jobEntity.id,
    networkId: jobEntity.networkId,
    status: jobEntity.status,
    recordingOracleAddress: jobEntity.recordingOracleAddress,
    reputationOracleAddress: jobEntity.reputationOracleAddress,
    exchangeOracleAddress: jobEntity.exchangeOracleAddress,
    recordingOracleUrl: jobEntity.recordingOracleUrl,
    reputationOracleUrl: jobEntity.reputationOracleUrl,
    exchangeOracleUrl: jobEntity.exchangeOracleUrl,
    ...manifestFormatter(jobEntity),
  };
};
