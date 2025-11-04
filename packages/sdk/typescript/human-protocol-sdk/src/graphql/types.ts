import { IReputationNetwork } from '../interfaces';

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

export type HMTHolderData = {
  address: string;
  balance: string;
};

export type StatusEvent = {
  timestamp: string;
  escrowAddress: string;
  status: string;
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
  role: string | null;
  fee: string | null;
  publicKey: string | null;
  webhookUrl: string | null;
  website: string | null;
  url: string | null;
  registrationNeeded: boolean | null;
  registrationInstructions: string | null;
  name: string | null;
  category: string | null;
  jobTypes: string | string[] | null;
  reputationNetworks: { address: string }[];
  staker: {
    stakedAmount: string;
    lockedAmount: string;
    lockedUntilTimestamp: string;
    withdrawnAmount: string;
    slashedAmount: string;
    lastDepositTimestamp: string;
  } | null;
}

export interface IReputationNetworkSubgraph
  extends Omit<IReputationNetwork, 'operators'> {
  operators: IOperatorSubgraph[];
}

export type PayoutData = {
  id: string;
  escrowAddress: string;
  recipient: string;
  amount: string;
  createdAt: string;
};

export type CancellationRefundData = {
  id: string;
  escrowAddress: string;
  receiver: string;
  amount: string;
  block: string;
  timestamp: string;
  txHash: string;
};
