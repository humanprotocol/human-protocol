import { IReputationNetwork } from '../interfaces';
import { ChainId } from '../enums';

export type EscrowData = {
  id: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
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
  recordingOracleFee: string | null;
  reputationOracleFee: string | null;
  exchangeOracleFee: string | null;
  status: string;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
};

export type WorkerData = {
  id: string;
  address: string;
  totalHMTAmountReceived: string;
  payoutCount: string;
};

export type InternalTransactionData = {
  from: string;
  to: string;
  value: string;
  method: string;
  receiver: string | null;
  escrow: string | null;
  token: string | null;
  id: string | null;
};

export type TransactionData = {
  block: string;
  txHash: string;
  from: string;
  to: string;
  timestamp: string;
  value: string;
  method: string;
  receiver: string | null;
  escrow: string | null;
  token: string | null;
  internalTransactions: InternalTransactionData[];
};

export type HMTStatisticsData = {
  totalTransferEventCount: string;
  totalBulkTransferEventCount: string;
  totalApprovalEventCount: string;
  totalBulkApprovalEventCount: string;
  totalValueTransfered: string;
  holders: string;
};

export type EscrowStatisticsData = {
  fundEventCount: string;
  storeResultsEventCount: string;
  bulkPayoutEventCount: string;
  pendingStatusEventCount: string;
  cancelledStatusEventCount: string;
  partialStatusEventCount: string;
  paidStatusEventCount: string;
  completedStatusEventCount: string;
  totalEventCount: string;
  totalEscrowCount: string;
};

export type EventDayData = {
  timestamp: string;
  dailyFundEventCount: string;
  dailyStoreResultsEventCount: string;
  dailyBulkPayoutEventCount: string;
  dailyPendingStatusEventCount: string;
  dailyCancelledStatusEventCount: string;
  dailyPartialStatusEventCount: string;
  dailyPaidStatusEventCount: string;
  dailyCompletedStatusEventCount: string;
  dailyTotalEventCount: string;
  dailyEscrowCount: string;
  dailyWorkerCount: string;
  dailyPayoutCount: string;
  dailyHMTPayoutAmount: string;
  dailyHMTTransferCount: string;
  dailyHMTTransferAmount: string;
  dailyUniqueSenders: string;
  dailyUniqueReceivers: string;
};

export type RewardAddedEventData = {
  escrowAddress: string;
  staker: string;
  slasher: string;
  amount: string;
};

export type DailyEscrowData = {
  timestamp: Date;
  escrowsTotal: string;
  escrowsPending: string;
  escrowsSolved: string;
  escrowsPaid: string;
  escrowsCancelled: string;
};

export type EscrowStatistics = {
  totalEscrows: string;
  dailyEscrowsData: DailyEscrowData[];
};

export type DailyWorkerData = {
  timestamp: Date;
  activeWorkers: string;
};

export type WorkerStatistics = {
  dailyWorkersData: DailyWorkerData[];
};

export type DailyPaymentData = {
  timestamp: Date;
  totalAmountPaid: string;
  totalCount: string;
  averageAmountPerWorker: string;
};

export type PaymentStatistics = {
  dailyPaymentsData: DailyPaymentData[];
};

export type HMTHolderData = {
  address: string;
  balance: string;
};

export type HMTHolder = {
  address: string;
  balance: string;
};

export type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: string;
  totalTransactionCount: string;
  dailyUniqueSenders: string;
  dailyUniqueReceivers: string;
};

export type HMTStatistics = {
  totalTransferAmount: string;
  totalTransferCount: string;
  totalHolders: string;
};

export type IMDataEntity = {
  served: string;
  solved: string;
};

export type IMData = Record<string, IMDataEntity>;

export type DailyTaskData = {
  timestamp: Date;
  tasksTotal: string;
  tasksSolved: string;
};

export type TaskStatistics = {
  dailyTasksData: DailyTaskData[];
};

export type StatusEvent = {
  timestamp: string;
  escrowAddress: string;
  status: string;
  chainId: ChainId;
};

export type KVStoreData = {
  id: string;
  address: string;
  key: string;
  value: string;
  timestamp: Date;
  block: string;
};

export type StakerData = {
  id: string;
  address: string;
  stakedAmount: string;
  lockedAmount: string;
  withdrawnAmount: string;
  slashedAmount: string;
  lockedUntilTimestamp: string;
  lastDepositTimestamp: string;
};

export interface IOperatorSubgraph {
  id: string;
  address: string;
  amountJobsProcessed: string;
  role?: string;
  fee?: string;
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
    stakedAmount: string;
    lockedAmount: string;
    lockedUntilTimestamp: string;
    withdrawnAmount: string;
    slashedAmount: string;
    lastDepositTimestamp: string;
  };
}

export interface IReputationNetworkSubgraph
  extends Omit<IReputationNetwork, 'operators'> {
  operators: IOperatorSubgraph[];
}
