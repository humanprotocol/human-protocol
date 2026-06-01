import { JobRequestType, SolutionError } from '../enums/job';

export interface IManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  requestType: JobRequestType;
}

export interface ISolution {
  workerAddress: string;
  solution: string;
  error?: boolean | SolutionError;
  verificationResult?: VerificationResult;
  rejectionReason?: SolutionError;
}

export interface ISolutionsFile {
  exchangeAddress: string;
  solutions: ISolution[];
}

export enum VerificationResult {
  Accepted = 'accepted',
  Rejected = 'rejected',
}
