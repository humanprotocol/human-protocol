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
