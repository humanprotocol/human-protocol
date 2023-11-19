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

export type DeployedCampaign = {
  escrowAddress: string;
  chainId: string;
  manifest: {
    chainId: string;
    startBlock: number;
    requesterDescription: string;
    endBlock: number;
    exchangeName: string;
    tokenA: string;
    tokenB: string;
    campaignDuration: 3110400;
    fundAmount: 22.074065996601036;
    type: string;
    requestType: string;
  };
};

export type CreateCampaign = {
  chainId?: ChainId;
  startBlock: number;
  endBlock: number;
  exchangeName: string;
  requesterDescription: string;
  tokenA: string;
  tokenB: string;
  campaignDuration: number;
  fundAmount: number;
  type: string;
};

export enum Exchange {
  UNISWAP_ETHEREUM = 'uniswap-ethereum',
  UNISWAP_POLYGON = 'uniswap-polygon',
  PANCAKESWAP_BSC = 'pancakeswap-bsc',
  BINANCE = 'binance',
}

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

export enum Campaign {
  Campaign = 'CAMPAIGN',
}

export type FortuneRequest = {
  title: string;
  fortunesRequested: number;
  description: string;
};

export enum JobStatus {
  ALL = 'ALL',
  LAUNCHED = 'LAUNCHED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export type CampaignData = {
  name: string;
  exchange: string;
  apr?: string;
  rewardPool?: string;
  rewardToken?: {
    symbol: string;
    quantity: string;
    total: string;
  };
  tvl?: string;
  endDate: string;
  status: string;
};

export type JobDetailsResponse = {
  details: {
    escrowAddress: string;
    manifestUrl: string;
    manifestHash: string;
    balance: number;
    paidOut: number;
    amountOfTasks: number;
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
