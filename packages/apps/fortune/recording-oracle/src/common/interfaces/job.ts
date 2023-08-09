import { ChainId } from "@human-protocol/sdk";
import { JobRequestType } from "../enums/job";

export interface IManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: string;
  requestType: JobRequestType;
}

export interface ISolution {
  exchangeAddress: string;
  workerAddress: string;
  solution: string;
}
