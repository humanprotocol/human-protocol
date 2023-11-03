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

export type CreateCvatJobRequest = {
  chainId: number;
  requesterDescription: string;
  fundAmount: number;
  dataUrl: string;
  labels: string[];
  minQuality: number;
  gtUrl: string;
  userGuide: string;
  type: CvatJobType;
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
  CVAT,
}

export enum CvatJobType {
  IMAGE_POINTS = 'IMAGE_POINTS',
  IMAGE_BOXES = 'IMAGE_BOXES',
}

export type FortuneRequest = {
  title: string;
  fortunesRequested: number;
  description: string;
};

export type CvatRequest = {
  labels: string[];
  type: CvatJobType;
  description: string;
  dataUrl: string;
  groundTruthUrl: string;
  userGuide: string;
  accuracyTarget: number;
};

export type JobRequest = {
  jobType: JobType;
  chainId?: ChainId;
  fortuneRequest?: FortuneRequest;
  cvatRequest?: CvatRequest;
};

export enum JobStatus {
  LAUNCHED = 'LAUNCHED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  TO_CANCEL = 'TO_CANCEL',
  PAID = 'PAID',
}

export type JobDetailsResponse = {
  details: {
    escrowAddress: string;
    manifestUrl: string;
    manifestHash: string;
    balance: number;
    paidOut: number;
    status: string;
  };
  manifest: {
    chainId: number;
    title: string;
    description: string;
    submissionsRequired: number;
    tokenAddress: string;
    fundAmount: number;
    requesterAddress: string;
    requestType: string;
    exchangeOracleAddress: string;
    recordingOracleAddress: string;
    reputationOracleAddress: string;
  };
  staking: {
    staker: string;
    allocated: number;
    slashed: number;
  };
};
