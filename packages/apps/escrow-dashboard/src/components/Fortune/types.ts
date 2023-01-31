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
  fortunesRequired: number;
  token: string;
  fundAmount: number;
  jobRequester: string;
};
