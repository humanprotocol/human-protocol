import { BigNumber } from 'ethers';
import { EscrowStatus } from './types';

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

export interface ILeader {
  id: string;
  address: string;
  amountStaked: BigNumber;
  amountAllocated: BigNumber;
  amountLocked: BigNumber;
  lockedUntilTimestamp: BigNumber;
  amountWithdrawn: BigNumber;
  amountSlashed: BigNumber;
  reputation: BigNumber;
  reward: BigNumber;
  amountJobsLaunched: BigNumber;
  role?: string;
  fee?: BigNumber;
  publicKey?: string;
  webhookUrl?: string;
  url?: string;
}

export interface ILeadersFilter {
  role?: string;
}

export interface IEscrowsFilter {
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  status?: EscrowStatus;
  from?: Date;
  to?: Date;
}

export interface IEscrowConfig {
  recordingOracle: string;
  reputationOracle: string;
  exchangeOracle: string;
  recordingOracleFee: BigNumber;
  reputationOracleFee: BigNumber;
  exchangeOracleFee: BigNumber;
  manifestUrl: string;
  manifestHash: string;
}

export interface IKeyPair {
  privateKey: string;
  publicKey: string;
  passphrase: string;
  revocationCertificate?: string;
}

export interface IStatisticsParams {
  from?: Date;
  to?: Date;
  limit?: number;
}
