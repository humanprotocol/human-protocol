import { AutoMap } from '@automapper/classes';

export class UserStatsCommand {
  @AutoMap()
  email: string;
  @AutoMap()
  siteKey: string;
}
export class UserStatsApiResponse {
  @AutoMap()
  solved: number;
  @AutoMap()
  served: number;
  @AutoMap()
  verified: number;
  @AutoMap()
  balance: BalanceStats;
  @AutoMap()
  earnings_data: object;
  @AutoMap()
  dropoff_data: object;
}

export type BalanceStats = {
  available: number;
  estimated: number;
  recent: number;
  total: number;
};

export type CurrentDayStats = {
  billing_units: number;
  bypass: number;
  served: number;
  solved: number;
};

export class UserStatsResponse {
  @AutoMap()
  solved: number;
  @AutoMap()
  served: number;
  @AutoMap()
  verified: number;
  @AutoMap()
  balance: BalanceStats;
  @AutoMap()
  currentDateStats: CurrentDayStats;
  @AutoMap()
  currentEarningsStats: number;
}
