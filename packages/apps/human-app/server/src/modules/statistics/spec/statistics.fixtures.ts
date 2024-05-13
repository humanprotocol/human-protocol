import {
  UserStatisticsCommand,
  UserStatisticsDetails,
  UserStatisticsResponse,
} from '../model/user-statistics.model';
import {
  OracleStatisticsCommand,
  OracleStatisticsDetails,
  OracleStatisticsResponse,
} from '../model/oracle-statistics.model';
import { AxiosRequestConfig } from 'axios';

const ASSIGNMENTS_AMOUNT = 2137;
const SUBMISSIONS_SENT = 1969;
const ASSIGNMENTS_COMPLETED_USER = 3;
const ASSIGNMENTS_REJECTED_USER = 666;
const ASSIGNMENTS_EXPIRED_USER = 42;
const ESCROWS_PROCESSED = 34290311;
const ESCROWS_ACTIVE = 451132343;
const ESCROWS_CANCELLED = 7833;
const WORKERS_AMOUNT = 3409;
const ASSIGNMENTS_COMPLETED_ORACLE = 154363;
const ASSIGNMENTS_REJECTED_ORACLE = 231;
const ASSIGNMENTS_EXPIRED_ORACLE = 434;
const EXCHANGE_ORACLE_ADDRESS = '0x32df932';
const EXCHANGE_ORACLE_URL = 'https://test.oracle.com';
const TOKEN = 'test-token';
export const statisticsToken = TOKEN;
export const statisticsExchangeOracleAddress = EXCHANGE_ORACLE_ADDRESS;
export const statisticsExchangeOracleUrl = EXCHANGE_ORACLE_URL;
export const userStatsResponseFixture: UserStatisticsResponse = {
  assignments_amount: ASSIGNMENTS_AMOUNT,
  submissions_sent: SUBMISSIONS_SENT,
  assignments_completed: ASSIGNMENTS_COMPLETED_USER,
  assignments_rejected: ASSIGNMENTS_REJECTED_USER,
  assignments_expired: ASSIGNMENTS_EXPIRED_USER,
};

export const oracleStatsResponseFixture: OracleStatisticsResponse = {
  escrows_processed: ESCROWS_PROCESSED,
  escrows_active: ESCROWS_ACTIVE,
  escrows_cancelled: ESCROWS_CANCELLED,
  workers_amount: WORKERS_AMOUNT,
  assignments_completed: ASSIGNMENTS_COMPLETED_ORACLE,
  assignments_rejected: ASSIGNMENTS_REJECTED_ORACLE,
  assignments_expired: ASSIGNMENTS_EXPIRED_ORACLE,
};

export const userStatsCommandFixture: UserStatisticsCommand = {
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
  token: TOKEN,
};
export const userStatsDetailsFixture: UserStatisticsDetails = {
  exchangeOracleUrl: EXCHANGE_ORACLE_ADDRESS,
  token: TOKEN,
};

export const oracleStatsCommandFixture: OracleStatisticsCommand = {
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
};
export const oracleStatsDetailsFixture: OracleStatisticsDetails = {
  exchangeOracleUrl: EXCHANGE_ORACLE_URL,
};
export const requestContextFixture = {
  token: TOKEN,
};
export const userStatsOptionsFixture: AxiosRequestConfig = {
  method: 'GET',
  url: `${EXCHANGE_ORACLE_URL}/stats/assignment`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
};

export const oracleStatsOptionsFixture: AxiosRequestConfig = {
  method: 'GET',
  url: `${EXCHANGE_ORACLE_URL}/stats`,
};
