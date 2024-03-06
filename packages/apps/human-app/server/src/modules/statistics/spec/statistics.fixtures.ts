import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from '../interfaces/user-statistics.interface';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from '../interfaces/oracle-statistics.interface';
import { AxiosRequestConfig } from 'axios';

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
};

export const oracleStatsCommandFixture: OracleStatisticsCommand = {
  oracle_url: 'https://test.oracle.com',
};
const userTokenFixture = 'test-token';
export const requestContextFixture = {
  token: userTokenFixture,
};
export const oracleUrlFixture = 'https://test.oracle.com';
export const userStatsOptionsFixture: AxiosRequestConfig = {
  method: 'GET',
  url: `${oracleUrlFixture}/stats/assignment`,
  headers: {
    Authorization: `Bearer ${userTokenFixture}`,
  },
}

export const oracleStatsOptionsFixture: AxiosRequestConfig = {
  method: 'GET',
  url: `${oracleUrlFixture}/stats`,
}
