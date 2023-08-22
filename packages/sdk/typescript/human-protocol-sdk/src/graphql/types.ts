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
  status: string;
  token: string;
  totalFundedAmount: string;
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
  totalAmountPaid: number;
  totalCount: number;
  averageAmountPerJob: number;
  averageAmountPerWorker: number;
};

export type PaymentStatistics = {
  dailyPaymentsData: DailyPaymentData[];
};

export type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: number;
  totalTransactionCount: number;
};

export type HMTHolder = {
  address: string;
  balance: string;
};

export type HMTStatistics = {
  totalTransferAmount: number;
  totalHolders: number;
  totalSupply: number;
  holders: HMTHolder[];
  dailyHMTData: DailyHMTData[];
};
