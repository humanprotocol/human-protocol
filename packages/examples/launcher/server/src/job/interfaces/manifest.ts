import { JobMode, JobRequestType } from "../../common/decorators";

export interface IJobManifestDto {
  data: string;
  datasetLength: number;
  recordingOracleAddress: string;
  reputationOracleAddress: string;
  exchangeOracleAddress: string;
  recordingOracleUrl: string;
  reputationOracleUrl: string;
  exchangeOracleUrl: string;
  recordingOracleStake: number;
  reputationOracleStake: number;
  dataUrl: string;
  annotationsPerImage: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
  mode: JobMode;
  requestType: JobRequestType;
}
