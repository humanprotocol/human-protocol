import { BigNumber } from 'ethers';

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
  averageJobsSolved: number;
};

export type WorkerStatistics = {
  dailyWorkersData: DailyWorkerData[];
};

export type DailyPaymentData = {
  timestamp: Date;
  totalAmountPaid: BigNumber;
  totalCount: number;
  averageAmountPerJob: BigNumber;
  averageAmountPerWorker: BigNumber;
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
  balance: BigNumber;
};

export type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: BigNumber;
  totalTransactionCount: number;
};

export type HMTStatistics = {
  totalTransferAmount: BigNumber;
  totalHolders: number;
  holders: HMTHolder[];
  dailyHMTData: DailyHMTData[];
};
