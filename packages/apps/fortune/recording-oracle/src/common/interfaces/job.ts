import { JobRequestType, SolutionError } from '../enums/job';

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
  error?: boolean | SolutionError;
}

export interface ISolutionsFile {
  exchangeAddress: string;
  solutions: ISolution[];
}
