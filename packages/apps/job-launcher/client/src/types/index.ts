import { ChainId } from '@human-protocol/sdk';

export type SignInRequest = {
  email: string;
  password: string;
  hCaptchaToken: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  hCaptchaToken: string;
};

export type SignUpResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ResetPasswordRequest = {
  password: string;
  token: string;
  hCaptchaToken: string;
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
  currency: string;
  fundAmount: number;
};

export type CreateCvatJobRequest = {
  chainId: number;
  requesterDescription: string;
  fundAmount: number;
  currency: string;
  data: CvatDataSource;
  labels: string[];
  minQuality: number;
  groundTruth: CvatDataSource;
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
  HCAPTCHA,
}

export enum CvatJobType {
  IMAGE_POINTS = 'IMAGE_POINTS',
  IMAGE_BOXES = 'IMAGE_BOXES',
  IMAGE_BOXES_FROM_POINTS = 'IMAGE_BOXES_FROM_POINTS',
  IMAGE_SKELETONS_FROM_BOXES = 'IMAGE_SKELETONS_FROM_BOXES',
}

export enum HCaptchaJobType {
  POLYGON = 'polygon',
  CATEGORIZATION = 'categorization',
  POINT = 'point',
  BOUNDING_BOX = 'bounding_box',
  COMPARISON = 'comparison',
}

export type FortuneRequest = {
  title: string;
  fortunesRequested: number;
  description: string;
};

export enum StorageProviders {
  AWS = 'AWS',
  GCS = 'GCS',
}

export enum AWSRegions {
  AF_SOUTH_1 = 'af-south-1',
  AP_EAST_1 = 'ap-east-1',
  AP_NORTHEAST_1 = 'ap-northeast-1',
  AP_NORTHEAST_2 = 'ap-northeast-2',
  AP_NORTHEAST_3 = 'ap-northeast-3',
  AP_SOUTH_1 = 'ap-south-1',
  AP_SOUTH_2 = 'ap-south-2',
  AP_SOUTHEAST_1 = 'ap-southeast-1',
  AP_SOUTHEAST_2 = 'ap-southeast-2',
  AP_SOUTHEAST_3 = 'ap-southeast-3',
  AP_SOUTHEAST_4 = 'ap-southeast-4',
  CA_CENTRAL_1 = 'ca-central-1',
  CN_NORTH_1 = 'cn-north-1',
  CN_NORTHWEST_1 = 'cn-northwest-1',
  EU_CENTRAL_1 = 'eu-central-1',
  EU_CENTRAL_2 = 'eu-central-2',
  EU_NORTH_1 = 'eu-north-1',
  EU_SOUTH_1 = 'eu-south-1',
  EU_SOUTH_2 = 'eu-south-2',
  EU_WEST_1 = 'eu-west-1',
  EU_WEST_2 = 'eu-west-2',
  EU_WEST_3 = 'eu-west-3',
  IL_CENTRAL_1 = 'il-central-1',
  ME_CENTRAL_1 = 'me-central-1',
  ME_SOUTH_1 = 'me-south-1',
  SA_EAST_1 = 'sa-east-1',
  US_EAST_1 = 'us-east-1',
  US_EAST_2 = 'us-east-2',
  US_GOV_EAST_1 = 'us-gov-east-1',
  US_GOV_WEST_1 = 'us-gov-west-1',
  US_WEST_1 = 'us-west-1',
  US_WEST_2 = 'us-west-2',
}

export enum GCSRegions {
  ASIA_EAST1 = 'asia-east1', // Taiwan
  ASIA_EAST2 = 'asia-east2', // Hong Kong
  ASIA_NORTHEAST1 = 'asia-northeast1', // Tokyo
  ASIA_NORTHEAST2 = 'asia-northeast2', // Osaka
  ASIA_NORTHEAST3 = 'asia-northeast3', // Seoul
  ASIA_SOUTH1 = 'asia-south1', // Bombay
  ASIA_SOUTH2 = 'asia-south2', // Delhi
  ASIA_SOUTHEAST1 = 'asia-southeast1', // Singapore
  ASIA_SOUTHEAST2 = 'asia-southeast2', // Jakarta
  AUSTRALIA_SOUTHEAST1 = 'australia-southeast1', // Sydney
  AUSTRALIA_SOUTHEAST2 = 'australia-southeast2', // Melbourne
  EUROPE_CENTRAL2 = 'europe-central2', // Warsaw
  EUROPE_NORTH1 = 'europe-north1', // Finland (Low CO2 footprint)
  EUROPE_SOUTHWEST1 = 'europe-southwest1', // Madrid
  EUROPE_WEST1 = 'europe-west1', // Belgium (Low CO2 footprint)
  EUROPE_WEST2 = 'europe-west2', // London (Low CO2 footprint)
  EUROPE_WEST3 = 'europe-west3', // Frankfurt (Low CO2 footprint)
  EUROPE_WEST4 = 'europe-west4', // Netherlands
  EUROPE_WEST6 = 'europe-west6', // Zurich (Low CO2 footprint)
  EUROPE_WEST8 = 'europe-west8', // Milan
  EUROPE_WEST9 = 'europe-west9', // Paris (Low CO2 footprint)
  EUROPE_WEST10 = 'europe-west10', // Berlin
  EUROPE_WEST12 = 'europe-west12', // Turin
  ME_CENTRAL1 = 'me-central1', // Doha
  ME_CENTRAL2 = 'me-central2', // Dammam, Saudi Arabia
  ME_WEST1 = 'me-west1', // Tel Aviv
  NORTHAMERICA_NORTHEAST1 = 'northamerica-northeast1', // Montreal (Low CO2 footprint)
  NORTHAMERICA_NORTHEAST2 = 'northamerica-northeast2', // Toronto (Low CO2 footprint)
  SOUTHAMERICA_EAST1 = 'southamerica-east1', // São Paulo (Low CO2 footprint)
  SOUTHAMERICA_WEST1 = 'southamerica-west1', // Santiago (Low CO2 footprint)
  US_CENTRAL1 = 'us-central1', // Iowa (Low CO2 footprint)
  US_EAST1 = 'us-east1', // South Carolina
  US_EAST4 = 'us-east4', // Northern Virginia
  US_EAST5 = 'us-east5', // Columbus
  US_SOUTH1 = 'us-south1', // Dallas
  US_WEST1 = 'us-west1', // Oregon (Low CO2 footprint)
  US_WEST2 = 'us-west2', // Los Angeles
  US_WEST3 = 'us-west3', // Salt Lake City
  US_WEST4 = 'us-west4', // Las Vegas
}

type CvatDataSource = {
  provider: StorageProviders;
  region: AWSRegions | GCSRegions;
  bucketName: string;
  path: string;
};

type CvatData = {
  dataset: CvatDataSource;
  points?: CvatDataSource;
  boxes?: CvatDataSource;
};

export type Label = {
  name: string;
  nodes?: string[];
  joints?: string[];
};

export type CvatRequest = {
  labels: Label[];
  type: CvatJobType;
  description: string;
  data: CvatData;
  groundTruth: CvatDataSource;
  userGuide: string;
  accuracyTarget: number;
};

export type HCaptchaRequest = {
  dataUrl: string;
  accuracyTarget: number;
  completionDate: Date;
  minRequests: number;
  maxRequests: number;
  advanced: {
    workerLanguage: string;
    workerLocation: string;
    targetBrowser: string;
  };
  annotations: {
    typeOfJob: string;
    taskBidPrice: number;
    label: string;
    labelingPrompt: string;
    groundTruths: string;
    exampleImages: string[];
  };
};

export type JobRequest = {
  jobType: JobType;
  chainId?: ChainId;
  fortuneRequest?: FortuneRequest;
  cvatRequest?: CvatRequest;
  hCaptchaRequest?: HCaptchaRequest;
};

export enum JobStatus {
  LAUNCHED = 'LAUNCHED',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  TO_CANCEL = 'TO_CANCEL',
  PAID = 'PAID',
  SET_UP = 'SET_UP',
  CREATED = 'CREATED',
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

export type JobDetailsResults = JobDetailsResponse & {
  results?: FortuneFinalResult[] | string;
};

export type FortuneFinalResult = {
  exchangeAddress: string;
  workerAddress: string;
  solution: string;
};
