export class OracleStatisticsResponse {
  escrows_processed: number;
  escrows_active: number;
  escrows_cancelled: number;
  workers_amount: number;
  assignments_completed: number;
  assignments_rejected: number;
  assignments_expired: number;
}
export class OracleStatisticsCommand {
  exchangeOracleUrl: string;
}
