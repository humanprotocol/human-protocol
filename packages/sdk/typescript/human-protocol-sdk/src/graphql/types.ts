import { ChainId } from '../enums';

export type EscrowData = {
  id: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
  factoryAddress: string;
  finalResultsUrl?: string;
  intermediateResultsUrl?: string;
  launcher: string;
  manifestHash?: string;
  manifestUrl?: string;
  recordingOracle?: string;
  recordingOracleFee?: string;
  reputationOracle?: string;
  reputationOracleFee?: string;
  exchangeOracle?: string;
  exchangeOracleFee?: string;
  status: string;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
  chainId: number;
};

export type PayoutData = {
  id: string;
  escrowAddress: string;
  recipient: string;
  amount: string;
  createdAt: string;
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
  setupEventCount: string;
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
  dailySetupEventCount: string;
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
  dailyPayoutAmount: string;
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
  escrowsTotal: number;
  escrowsPending: number;
  escrowsSolved: number;
  escrowsPaid: number;
  escrowsCancelled: number;
};

export type EscrowStatistics = {
  totalEscrows: number;
  dailyEscrowsData: DailyEscrowData[];
};

export type DailyWorkerData = {
  timestamp: Date;
  activeWorkers: number;
};

export type WorkerStatistics = {
  dailyWorkersData: DailyWorkerData[];
};

export type DailyPaymentData = {
  timestamp: Date;
  totalAmountPaid: bigint;
  totalCount: number;
  averageAmountPerWorker: bigint;
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
  balance: bigint;
};

export type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: bigint;
  totalTransactionCount: number;
  dailyUniqueSenders: number;
  dailyUniqueReceivers: number;
};

export type HMTStatistics = {
  totalTransferAmount: bigint;
  totalTransferCount: number;
  totalHolders: number;
  holders: HMTHolder[];
  dailyHMTData: DailyHMTData[];
};

export type IMDataEntity = {
  served: number;
  solved: number;
};

export type IMData = Record<string, IMDataEntity>;

export type DailyTaskData = {
  timestamp: Date;
  tasksTotal: number;
  tasksSolved: number;
};

export type TaskStatistics = {
  dailyTasksData: DailyTaskData[];
};

export type StatusEvent = {
  timestamp: number;
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
  block: number;
};
