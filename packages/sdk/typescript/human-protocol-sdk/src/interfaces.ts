import { EscrowStatus } from './types';
import { ChainId, OrderDirection } from './enums';

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
  amountJobsProcessed: bigint;
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

export interface IEscrowsFilter extends IPagination {
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  jobRequesterId?: string;
  status?: EscrowStatus;
  from?: Date;
  to?: Date;
  chainId: ChainId;
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

export interface IStatisticsFilter extends IPagination {
  from?: Date;
  to?: Date;
}

export interface IHMTHoldersParams extends IPagination {
  address?: string;
}

export interface IPayoutFilter {
  escrowAddress?: string;
  recipient?: string;
  from?: Date;
  to?: Date;
}

export interface IKVStore {
  key: string;
  value: string;
}

export interface ITransaction {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: string;
  method: string;
}

export interface ITransactionsFilter extends IPagination {
  chainId: ChainId;
  startBlock?: number;
  endBlock?: number;
  startDate?: Date;
  endDate?: Date;
  fromAddress?: string;
  toAddress?: string;
}

export interface IPagination {
  first?: number;
  skip?: number;
  orderDirection?: OrderDirection;
}
