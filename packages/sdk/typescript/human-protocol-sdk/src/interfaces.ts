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
  stakedAmount: bigint | null;
  lockedAmount: bigint | null;
  lockedUntilTimestamp: number | null;
  withdrawnAmount: bigint | null;
  slashedAmount: bigint | null;
  amountJobsProcessed: bigint | null;
  role: string | null;
  fee: bigint | null;
  publicKey: string | null;
  webhookUrl: string | null;
  website: string | null;
  url: string | null;
  jobTypes: string[] | null;
  registrationNeeded: boolean | null;
  registrationInstructions: string | null;
  reputationNetworks: string[];
  name: string | null;
  category: string | null;
}

export interface IOperatorsFilter extends IPagination {
  chainId: ChainId;
  roles?: string[];
  minStakedAmount?: number;
  orderBy?: string;
  retryConfig?: SubgraphRetryConfig;
}

export interface IReputationNetwork {
  id: string;
  address: string;
  operators: IOperator[];
}

export interface IEscrow {
  id: string;
  address: string;
  amountPaid: bigint;
  balance: bigint;
  count: number;
  factoryAddress: string;
  finalResultsUrl: string | null;
  finalResultsHash: string | null;
  intermediateResultsUrl: string | null;
  intermediateResultsHash: string | null;
  launcher: string;
  jobRequesterId: string | null;
  manifestHash: string | null;
  manifest: string | null;
  recordingOracle: string | null;
  reputationOracle: string | null;
  exchangeOracle: string | null;
  recordingOracleFee: number | null;
  reputationOracleFee: number | null;
  exchangeOracleFee: number | null;
  status: string;
  token: string;
  totalFundedAmount: bigint;
  createdAt: number;
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
  retryConfig?: SubgraphRetryConfig;
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
  retryConfig?: SubgraphRetryConfig;
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
  retryConfig?: SubgraphRetryConfig;
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
  receiver: string | null;
  escrow: string | null;
  token: string | null;
}

export interface ITransaction {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: number;
  value: bigint;
  method: string;
  receiver: string | null;
  escrow: string | null;
  token: string | null;
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
  retryConfig?: SubgraphRetryConfig;
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
  retryConfig?: SubgraphRetryConfig;
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
  retryConfig?: SubgraphRetryConfig;
}

export interface IStaker {
  address: string;
  stakedAmount: bigint;
  lockedAmount: bigint;
  withdrawableAmount: bigint;
  slashedAmount: bigint;
  lockedUntil: number;
  lastDepositTimestamp: number;
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
  retryConfig?: SubgraphRetryConfig;
}
export interface ICancellationRefundFilter extends IPagination {
  chainId: ChainId;
  escrowAddress?: string;
  receiver?: string;
  from?: Date;
  to?: Date;
  retryConfig?: SubgraphRetryConfig;
}

export interface IDailyEscrow {
  timestamp: number;
  escrowsTotal: number;
  escrowsPending: number;
  escrowsSolved: number;
  escrowsPaid: number;
  escrowsCancelled: number;
}

export interface IEscrowStatistics {
  totalEscrows: number;
  dailyEscrowsData: IDailyEscrow[];
}

export interface IDailyWorker {
  timestamp: number;
  activeWorkers: number;
}

export interface IWorkerStatistics {
  dailyWorkersData: IDailyWorker[];
}

export interface IDailyPayment {
  timestamp: number;
  totalAmountPaid: bigint;
  totalCount: number;
  averageAmountPerWorker: bigint;
}

export interface IPaymentStatistics {
  dailyPaymentsData: IDailyPayment[];
}

export interface IHMTStatistics {
  totalTransferAmount: bigint;
  totalTransferCount: number;
  totalHolders: number;
}

export interface IHMTHolder {
  address: string;
  balance: bigint;
}

export interface IDailyHMT {
  timestamp: number;
  totalTransactionAmount: bigint;
  totalTransactionCount: number;
  dailyUniqueSenders: number;
  dailyUniqueReceivers: number;
}

export interface IStatusEvent {
  timestamp: number;
  escrowAddress: string;
  status: EscrowStatus;
  chainId: ChainId;
}

export interface ICancellationRefund {
  id: string;
  escrowAddress: string;
  receiver: string;
  amount: bigint;
  block: number;
  timestamp: number;
  txHash: string;
}

export interface IPayout {
  id: string;
  escrowAddress: string;
  recipient: string;
  amount: bigint;
  createdAt: number;
}

export interface IEscrowWithdraw {
  txHash: string;
  tokenAddress: string;
  withdrawnAmount: bigint;
}

/**
 * Configuration options for subgraph requests with retry logic.
 */
export interface SubgraphRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay between retries in milliseconds (default: 1000) */
  baseDelay?: number;
}
