import { BigNumber } from 'ethers';

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
  staker: string;
  tokensStaked: BigNumber;
  tokensAllocated: BigNumber;
  tokensLocked: BigNumber;
  tokensLockedUntil: BigNumber;
  tokensAvailable: BigNumber;
}

type EscrowStatus =
  | 'Launched'
  | 'Pending'
  | 'Partial'
  | 'Paid'
  | 'Complete'
  | 'Cancelled';

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
}
