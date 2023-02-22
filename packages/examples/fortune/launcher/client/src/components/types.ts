export enum FortuneStageStatus {
  FUNDING_METHOD,
  JOB_REQUEST,
  LAUNCH,
  LAUNCH_SUCCESS,
  LAUNCH_FAIL,
}

export type FundingMethodType = 'crypto' | 'fiat';

export type FortuneJobRequestType = {
  chainId: number;
  title: string;
  description: string;
  fortunesRequired: string;
  token: string;
  fundAmount: string;
  jobRequester: string;
};

export type JobLaunchResponse = {
  escrowAddress: string;
  exchangeUrl: string;
};
