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

export const RAW_TOKEN_STATS_QUERY = `{
  hmtokenStatistics(id: "hmt-statistics-id") {
    totalApprovalEventCount
    totalTransferEventCount
    totalValueTransfered
    token
    holders
  }
}`;
