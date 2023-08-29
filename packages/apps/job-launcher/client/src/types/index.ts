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
};

export type ResetPasswordRequest = {
  password: string;
  confirm: string;
  token: string;
};

export type CryptoPaymentRequest = {
  chainId: number;
  transactionHash: string;
};

export type FiatPaymentRequest = {
  amount: number;
  currency: string;
};

export type CreateFortuneJobRequest = {
  chainId: number;
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: number;
};

export type CreateAnnotationJobRequest = {
  chainId: number;
  dataUrl: string;
  submissionsRequired: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  fundAmount: number;
};

export enum CreateJobStep {
  FundingMethod,
  CreateJob,
  PayJob,
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

export type FortuneRequest = {
  title: string;
  fortunesRequested: number;
  description: string;
};

export type AnnotationRequest = {
  labels: string[];
  description: string;
  dataUrl: string;
  annotationsPerImage: number;
  accuracyTarget: number;
  rewardToWorkers: number;
};

export type JobRequest = {
  jobType: JobType;
  chainId: ChainId;
  fortuneRequest?: FortuneRequest;
  annotationRequest?: AnnotationRequest;
};
