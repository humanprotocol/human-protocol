export const RAW_ESCROW_STATS_QUERY = `{
  escrowStatistics(id:"escrow-statistics-id") {
    intermediateStorageEventCount
    pendingEventCount
    bulkTransferEventCount
  }
}`;

export const RAW_EVENT_DAY_DATA_QUERY = `{
  eventDayDatas(first: [COUNT_PARAM], orderBy: timestamp, orderDirection: desc) {
    timestamp
    dailyBulkTransferEvents
    dailyIntermediateStorageEvents
    dailyPendingEvents
    dailyEscrowAmounts
  }
}`;

export const RAW_EVENT_DAY_DATA_V2_QUERY = `{
  eventDayDatas(first: 365, orderBy: timestamp, orderDirection: desc) {
    id
    timestamp
    dailyBulkPayoutEventCount
    dailyCancelledStatusEventCount
    dailyCompletedStatusEventCount
    dailyEscrowCount
    dailyFundEventCount
    dailyHMTTransferAmount
    dailyHMTTransferCount
    dailyPaidStatusEventCount
    dailyPartialStatusEventCount
    dailyPayoutAmount
    dailyPayoutCount
    dailyPendingStatusEventCount
    dailySetupEventCount
    dailyStoreResultsEventCount
    dailyTotalEventCount
    dailyWorkerCount
  }
}`;

export const RAW_TOKEN_STATS_QUERY = `{
  hmtokenStatistics(id: "hmt-statistics-id") {
    totalApprovalEventCount
    totalTransferEventCount
    totalValueTransfered
    token
    holders
  }
}`;

export const RAW_LEADERS_QUERY = `{
  leaders(orderBy: amountStaked, orderDirection: desc) {
    id
    address
    role
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountSlashed
    amountWithdrawn
    reputation
    amountJobsLaunched
  }
}`;

export const RAW_LEADER_QUERY = (address: string) => `{
  leader(id: "${address}") {
    id
    address
    role
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountSlashed
    amountWithdrawn
    reputation
    amountJobsLaunched
  }
}`;

export const RAW_DATA_SAVED_EVENTS_QUERY = `{
  dataSavedEvents(where: {key: $key, leader: $leader}, orderBy: timestamp, orderDirection: desc) {
    leader
    key
    value
    timestamp
  }
}`;

export const RAW_LEADER_ESCROWS_QUERY = (address: string) => `{
  launchedEscrows(from: "${address}", orderBy: amountAllocated, orderDirection: desc) {
    id
    amountAllocated
    amountPayout
    status
  }
}`;
