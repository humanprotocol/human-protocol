import { ChainId } from '../constants/networks';
import { IFortuneStorage } from './storage';

export interface IFortuneRequest {
  fortune: string;
  workerAddress: string;
  escrowAddress: string;
  chainId: ChainId;
}

export interface IFortuneResults {
  escrowAddress: string;
  chainId: number;
  fortunes: {
    [workerAddress: string]: IFortuneStorage[];
  };
}

export interface IRecordingOracleRequest {
  [escrowAddress: string]: {
    chainId: number;
    fortunes: {
      [workerAddress: string]: {
        fortune: string;
        score: boolean;
      };
    };
  };
}
