import { EscrowStatus } from './types';
import { ChainId } from './enums';

export interface IAllocation {
  escrowAddress: string;
  staker: string;
  tokens: bigint;
  createdAt: bigint;
  closedAt: bigint;
}

export interface IReward {
  escrowAddress: string;
  amount: bigint;
}

export interface ILeader {
  id: string;
  chainId: ChainId;
  address: string;
  amountStaked: bigint;
  amountAllocated: bigint;
  amountLocked: bigint;
  lockedUntilTimestamp: bigint;
  amountWithdrawn: bigint;
  amountSlashed: bigint;
  reputation: bigint;
  reward: bigint;
  amountJobsLaunched: bigint;
  role?: string;
  fee?: bigint;
  publicKey?: string;
  webhookUrl?: string;
  url?: string;
  jobTypes?: string[];
}

export interface ILeaderSubgraph extends Omit<ILeader, 'jobTypes'> {
  jobTypes?: string;
}

export interface ILeadersFilter {
  chainId: ChainId;
  role?: string;
}

export interface IReputationNetwork {
  id: string;
  address: string;
  operators: IOperator[];
}

export interface IReputationNetworkSubgraph
  extends Omit<IReputationNetwork, 'operators'> {
  operators: IOperatorSubgraph[];
}

export interface IOperator {
  address: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
}

export interface IOperatorSubgraph extends Omit<IOperator, 'jobTypes'> {
  jobTypes?: string;
}

export interface IEscrowsFilter {
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  jobRequesterId?: string;
  status?: EscrowStatus;
  from?: Date;
  to?: Date;
  networks: ChainId[];
}

export interface IEscrowConfig {
  recordingOracle: string;
  reputationOracle: string;
  exchangeOracle: string;
  recordingOracleFee: bigint;
  reputationOracleFee: bigint;
  exchangeOracleFee: bigint;
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

export interface IPayoutFilter {
  escrowAddress?: string;
  recipient?: string;
  from?: Date;
  to?: Date;
}
