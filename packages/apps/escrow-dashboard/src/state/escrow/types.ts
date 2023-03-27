export type EscrowEventDayData = {
  timestamp: string;
  dailyBulkTransferEvents: number;
  dailyIntermediateStorageEvents: number;
  dailyPendingEvents: number;
  dailyTotalEvents: number;
  dailyEscrowAmounts: number;
};

export type EscrowStats = {
  intermediateStorageEventCount: number;
  pendingEventCount: number;
  bulkTransferEventCount: number;
  totalEventCount: number;
};

export type EscrowData = {
  amount: number;
  stats: EscrowStats;
  lastMonthEvents: EscrowEventDayData[];
  totalSupply?: string;
};
