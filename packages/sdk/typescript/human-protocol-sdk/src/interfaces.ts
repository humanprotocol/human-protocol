import { BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import { NetworkData } from './types';

export interface IClientParams {
  signerOrProvider: Signer | Provider;
  network: NetworkData;
}

export interface IAllocation {
  escrowAddress: string;
  staker: string;
  tokens: BigNumber;
  createdAt: BigNumber;
  closedAt: BigNumber;
}

export interface IReward {
  escrowAddress: string;
  amount: BigNumber;
}

export interface IStaker {
  tokensStaked: BigNumber;
  tokensAllocated: BigNumber;
  tokensLocked: BigNumber;
  tokensLockedUntil: BigNumber;
  tokensAvailable: BigNumber;
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
