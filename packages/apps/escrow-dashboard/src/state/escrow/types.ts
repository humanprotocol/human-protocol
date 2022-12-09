export interface EscrowEventDayData {
  timestamp: string;
  dailyBulkTransferEvents: number;
  dailyIntermediateStorageEvents: number;
  dailyPendingEvents: number;
  dailyTotalEvents: number;
  dailyEscrowAmounts: number;
}

export interface EscrowStats {
  intermediateStorageEventCount: number;
  pendingEventCount: number;
  bulkTransferEventCount: number;
  totalEventCount: number;
}

export interface EscrowData {
  amount: number;
  stats: EscrowStats;
  lastMonthEvents: EscrowEventDayData[];
  totalSupply?: string;
}
