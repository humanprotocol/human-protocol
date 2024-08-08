export interface CachedDailyHMTData {
  date: string;
  totalTransactionAmount: string;
  totalTransactionCount: number;
  dailyUniqueSenders: number;
  dailyUniqueReceivers: number;
}

export interface MonthlyHMTData {
  totalTransactionAmount: string;
  totalTransactionCount: number;
  dailyUniqueSenders: number;
  dailyUniqueReceivers: number;
}
