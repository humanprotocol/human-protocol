import { JobRequestType } from '../enums/job';

export interface IManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: string;
  requestType: JobRequestType;
}

export interface ISolution {
  workerAddress: string;
  solution: string;
  invalid?: boolean;
}

export interface ISolutionsFile {
  exchangeAddress: string;
  solutions: ISolution[];
}
