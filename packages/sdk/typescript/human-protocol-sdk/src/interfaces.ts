import { BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import { NetworkData } from './types';

export interface IClientParams {
  signerOrProvider: Signer | Provider;
  network: NetworkData;
}

export interface IEscrowsFilter {
  address: string;
  role?: number;
  status?: number;
  from?: Date;
  to?: Date;
}

export interface IEscrowConfig {
  recordingOracle: string;
  reputationOracle: string;
  recordingOracleFee: BigNumber;
  reputationOracleFee: BigNumber;
  manifestUrl: string;
  hash: string;
}

export interface ILauncherEscrowsResult {
  id: string;
}
