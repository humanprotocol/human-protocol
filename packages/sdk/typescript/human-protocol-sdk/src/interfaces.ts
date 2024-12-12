import { EscrowStatus } from './types';
import { ChainId, OrderDirection } from './enums';

export interface IReward {
  escrowAddress: string;
  amount: bigint;
}

export interface ILeader {
  id: string;
  chainId: ChainId;
  address: string;
  amountStaked: bigint;
  amountLocked: bigint;
  lockedUntilTimestamp: bigint;
  amountWithdrawn: bigint;
  amountSlashed: bigint;
  reward: bigint;
  amountJobsProcessed: bigint;
  role?: string;
  fee?: bigint;
  publicKey?: string;
  webhookUrl?: string;
  website?: string;
  url?: string;
  jobTypes?: string[];
  registrationNeeded?: boolean;
  registrationInstructions?: string;
  reputationNetworks?: string[];
}

export interface ILeaderSubgraph
  extends Omit<ILeader, 'jobTypes' | 'reputationNetworks' | 'chainId'> {
  jobTypes?: string;
  reputationNetworks?: { address: string }[];
}

export interface ILeadersFilter extends IPagination {
  chainId: ChainId;
  role?: string;
  roles?: string[];
  minAmountStaked?: number;
  orderBy?: string;
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
  registrationNeeded?: boolean;
  registrationInstructions?: string;
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

export interface InternalTransaction {
  from: string;
  to: string;
  value: string;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
}

export interface ITransaction {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: string;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
  internalTransactions: InternalTransaction[];
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
