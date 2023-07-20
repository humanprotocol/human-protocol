import { ChainId } from '@human-protocol/sdk';

export type SignInRequest = {
  email: string;
  password: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  confirm: string;
};

export type SignUpResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

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
