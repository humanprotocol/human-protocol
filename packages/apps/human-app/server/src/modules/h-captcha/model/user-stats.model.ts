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
  earnings_data: DateValue[];
  @AutoMap()
  dropoff_data: DateValue[];
}

export type BalanceStats = {
  available: number;
  estimated: number;
  recent: number;
  total: number;
};
export type DateValue = {
  date: string;
  value: number;
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
  currentDateStats: DateValue;
  @AutoMap()
  currentEarningsStats: DateValue;
}
