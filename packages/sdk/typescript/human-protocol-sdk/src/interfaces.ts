import { EscrowStatus } from './types';
import { ChainId, OrderDirection } from './enums';

export interface IReward {
  escrowAddress: string;
  amount: bigint;
}

export interface IOperator {
  id: string;
  chainId: ChainId;
  address: string;
  stakedAmount: bigint;
  lockedAmount: bigint;
  lockedUntilTimestamp: bigint;
  withdrawnAmount: bigint;
  slashedAmount: bigint;
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
  name?: string;
  category?: string;
}

export interface IOperatorSubgraph {
  id: string;
  address: string;
  amountJobsProcessed: bigint;
  role?: string;
  fee?: bigint;
  publicKey?: string;
  webhookUrl?: string;
  website?: string;
  url?: string;
  registrationNeeded?: boolean;
  registrationInstructions?: string;
  name?: string;
  category?: string;
  jobTypes?: string | string[];
  reputationNetworks?: { address: string }[];
  staker?: {
    stakedAmount: bigint;
    lockedAmount: bigint;
    lockedUntilTimestamp: bigint;
    withdrawnAmount: bigint;
    slashedAmount: bigint;
    lastDepositTimestamp: bigint;
  };
}

export interface IOperatorsFilter extends IPagination {
  chainId: ChainId;
  roles?: string[];
  minStakedAmount?: number;
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

export interface IEscrow {
  id: string;
  address: string;
  amountPaid: bigint;
  balance: bigint;
  count: bigint;
  factoryAddress: string;
  finalResultsUrl?: string;
  finalResultsHash?: string;
  intermediateResultsUrl?: string;
  intermediateResultsHash?: string;
  launcher: string;
  jobRequesterId?: string;
  manifestHash?: string;
  manifest?: string;
  recordingOracle?: string;
  reputationOracle?: string;
  exchangeOracle?: string;
  recordingOracleFee?: bigint;
  reputationOracleFee?: bigint;
  exchangeOracleFee?: bigint;
  status: string;
  token: string;
  totalFundedAmount: bigint;
  createdAt: bigint;
  chainId: number;
}

export interface IEscrowsFilter extends IPagination {
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  jobRequesterId?: string;
  status?: EscrowStatus | EscrowStatus[];
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
  manifest: string;
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

export interface IPayoutFilter extends IPagination {
  chainId: ChainId;
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
  value: bigint;
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
  value: bigint;
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
  method?: string;
  escrow?: string;
  token?: string;
}

export interface IPagination {
  first?: number;
  skip?: number;
  orderDirection?: OrderDirection;
}

export interface StakerInfo {
  stakedAmount: bigint;
  lockedAmount: bigint;
  lockedUntil: bigint;
  withdrawableAmount: bigint;
}

export interface IStatusEventFilter extends IPagination {
  chainId: ChainId;
  statuses?: EscrowStatus[];
  from?: Date;
  to?: Date;
  launcher?: string;
}

export interface IWorker {
  id: string;
  address: string;
  totalHMTAmountReceived: bigint;
  payoutCount: number;
}

export interface IWorkersFilter extends IPagination {
  chainId: ChainId;
  address?: string;
  orderBy?: string;
}

export interface IStaker {
  address: string;
  stakedAmount: bigint;
  lockedAmount: bigint;
  lockedUntil: bigint;
  withdrawableAmount: bigint;
  slashedAmount: bigint;
  lastDepositTimestamp: bigint;
}

export interface IStakersFilter extends IPagination {
  chainId: ChainId;
  minStakedAmount?: string;
  maxStakedAmount?: string;
  minLockedAmount?: string;
  maxLockedAmount?: string;
  minWithdrawnAmount?: string;
  maxWithdrawnAmount?: string;
  minSlashedAmount?: string;
  maxSlashedAmount?: string;
  orderBy?:
    | 'stakedAmount'
    | 'lockedAmount'
    | 'withdrawnAmount'
    | 'slashedAmount'
    | 'lastDepositTimestamp';
}
export interface ICancellationRefundFilter extends IPagination {
  chainId: ChainId;
  escrowAddress?: string;
  receiver?: string;
  from?: Date;
  to?: Date;
}
