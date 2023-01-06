export interface IUser {
  email?: string | null;
}

export interface IJobDetails {
  id: number;
  price: number;
  labels: Array<string>;
  dataUrl: string;
  data: Array<{ datapoint_uri: string }>;
  annotationsPerImage: number;
  requesterDescription: string;
  requesterAccuracyTarget: number;
  networkId?: number;
  requestType?: string;
  datasetLength?: number;
  escrowAddress: string;
}
export interface ITx {
  hash: string;
}
export interface IJob {
  details: IJobDetails;
  tx: ITx;
}

export interface IGenericResponse {
  status: string;
  message: string;
}
