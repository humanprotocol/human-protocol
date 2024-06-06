import gql from 'graphql-tag';
import { IDateParams, IStatisticsParams } from '../../interfaces';

const HMTOKEN_STATISTICS_FRAGMENT = gql`
  fragment HMTokenStatisticsFields on HMTokenStatistics {
    totalTransferEventCount
    totalBulkTransferEventCount
    totalApprovalEventCount
    totalBulkApprovalEventCount
    totalValueTransfered
    holders
  }
`;

const ESCROW_STATISTICS_FRAGMENT = gql`
  fragment EscrowStatisticsFields on EscrowStatistics {
    fundEventCount
    setupEventCount
    storeResultsEventCount
    bulkPayoutEventCount
    pendingStatusEventCount
    cancelledStatusEventCount
    partialStatusEventCount
    paidStatusEventCount
    completedStatusEventCount
    totalEventCount
    totalEscrowCount
  }
`;

const EVENT_DAY_DATA_FRAGMENT = gql`
  fragment EventDayDataFields on EventDayData {
    timestamp
    dailyFundEventCount
    dailySetupEventCount
    dailyStoreResultsEventCount
    dailyBulkPayoutEventCount
    dailyPendingStatusEventCount
    dailyCancelledStatusEventCount
    dailyPartialStatusEventCount
    dailyPaidStatusEventCount
    dailyCompletedStatusEventCount
    dailyTotalEventCount
    dailyEscrowCount
    dailyWorkerCount
    dailyPayoutCount
    dailyPayoutAmount
    dailyHMTTransferCount
    dailyHMTTransferAmount
  }
`;

export const GET_HMTOKEN_STATISTICS_QUERY = gql`
  query GetHMTokenStatistics {
    hmtokenStatistics(id: "hmt-statistics-id") {
      ...HMTokenStatisticsFields
    }
  }
  ${HMTOKEN_STATISTICS_FRAGMENT}
`;

export const GET_ESCROW_STATISTICS_QUERY = gql`
  query GetEscrowStatistics {
    escrowStatistics(id: "escrow-statistics-id") {
      ...EscrowStatisticsFields
    }
  }
  ${ESCROW_STATISTICS_FRAGMENT}
`;

export const GET_EVENT_DAY_DATA_QUERY = (params: IStatisticsParams) => {
  const { from, to, limit } = params;
  const WHERE_CLAUSE = `
    where: {
      ${from !== undefined ? `timestamp_gte: $from` : ''}
      ${to !== undefined ? `timestamp_lte: $to` : ''}
    }
  `;
  const LIMIT_CLAUSE = `
    first: ${limit ? `$limit` : `1000`}
  `;

  return gql`
    query GetEscrowDayData($from: Int, $to: Int) {
      eventDayDatas(
        ${WHERE_CLAUSE},
        orderBy: timestamp,
        orderDirection: desc,
        ${LIMIT_CLAUSE}
      ) {
        ...EventDayDataFields
      }
    }
    ${EVENT_DAY_DATA_FRAGMENT}
  `;
};

export const DAILY_STATS_FRAGMENT = gql`
  fragment DailyStatsFields on DailyStats {
    id
    activeWorkers
    transactions
    uniqueSenders
    uniqueReceivers
    escrowsLaunched
    escrowsCompleted
    escrowPayouts
    timestamp
  }
`;

export const GET_DAILY_STATS_QUERY = (params: IDateParams) => {
  const { startDate, endDate, limit } = params;
  const WHERE_CLAUSE = `
    where: {
      ${startDate !== undefined ? `timestamp_gte: $startDate` : ''}
      ${endDate !== undefined ? `timestamp_lte: $endDate` : ''}
    }
  `;
  const LIMIT_CLAUSE = `
    first: ${limit ? `$limit` : `1000`}
  `;

  return gql`
    query GetDailyStats($startDate: Int, $endDate: Int) {
      dailyStats(
        ${WHERE_CLAUSE},
        orderBy: timestamp,
        orderDirection: desc,
        ${LIMIT_CLAUSE}
      ) {
        ...DailyStatsFields
      }
    }
    ${DAILY_STATS_FRAGMENT}
  `;
};
