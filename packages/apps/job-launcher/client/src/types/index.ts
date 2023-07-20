import { ChainId } from '@human-protocol/sdk';

export enum CreateJobStep {
  FundingMethod,
  CreateJob,
  PayJob,
  Launching,
  Launch,
}

export enum PayMethod {
  Crypto,
  Fiat,
}

export enum JobType {
  Fortune,
  Annotation,
}

export type JobRequest = {
  jobType: JobType;
  chainId: ChainId;
};
