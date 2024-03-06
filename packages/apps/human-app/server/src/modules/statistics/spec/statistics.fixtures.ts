import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from '../interfaces/user-statistics.interface';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from '../interfaces/oracle-statistics.interface';

export const userStatsResponseFixture: UserStatisticsResponse = {
  assignments_amount: 2137,
  submissions_sent: 1969,
  assignments_completed: 3,
  assignments_rejected: 666,
  assignments_expired: 42,
};

export const oracleStatsResponseFixture: OracleStatisticsResponse = {
  escrows_processed: 34290311,
  escrows_active: 451132343,
  escrows_cancelled: 7833,
  workers_amount: 3409,
  assignments_completed: 154363,
  assignments_rejected: 231,
  assignments_expired: 434,
};

export const userStatsCommandFixture: UserStatisticsCommand = {
  oracle_url: 'https://test.oracle.com',
  token: 'testToken',
};

export const oracleStatsCommandFixture: OracleStatisticsCommand = {
  oracle_url: 'https://test.oracle.com',
};
