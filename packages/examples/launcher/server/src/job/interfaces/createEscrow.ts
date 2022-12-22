import { JobRequestType } from "../../common/decorators";

export interface IJobCreateEscrowDto {
  networkId: string;
  dataUrl: string;
  datasetLength: number;
  annotationsPerImage: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
  requestType: JobRequestType;
}
