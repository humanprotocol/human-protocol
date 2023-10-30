import { Exchange } from '../enums/exchange';
import { JobRequestType, SolutionError } from '../enums/job';

export interface ILiquidityScore {
  exchangeAddress: string,
  escrowAddress: string,
  chainId: string,
  liquidityProvider:string,
  liquidityScore: string,
}

export interface ILiquidityScoreFile {
  exchangeAddress: string;
  liquidityScores: ILiquidityScore[];
}

export interface IManifest {
  submissionsRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  fundAmount: string;
  requestType: JobRequestType;
}

export class ICampaignManifest  {
  startBlock: number;
  endBlock: number;
  exchangeName: Exchange;
  tokenA: string;
  tokenB: string;
  campaignDuration: number;
  fundAmount: number;
  type: JobRequestType;
}