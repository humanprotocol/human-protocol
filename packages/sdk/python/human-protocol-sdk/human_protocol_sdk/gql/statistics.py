from human_protocol_sdk.statistics import StatisticsParam

hmtoken_statistics_fragment = """
fragment HMTokenStatisticsFields on HMTokenStatistics {
    totalTransferEventCount
    totalBulkTransferEventCount
    totalApprovalEventCount
    totalBulkApprovalEventCount
    totalValueTransfered
    holders
}
"""

escrow_statistics_fragment = """
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
"""

event_day_data_fragment = """
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
"""

get_hmtoken_statistics_query = """
query GetHMTokenStatistics {{
    hmtokenStatistics(id: "hmt-statistics-id") {{
        ...HMTokenStatisticsFields
    }}
}}
{hmtoken_statistics_fragment}
""".format(
    hmtoken_statistics_fragment=hmtoken_statistics_fragment
)

get_escrow_statistics_query = """
query GetEscrowStatistics {{
    escrowStatistics(id: "escrow-statistics-id") {{
        ...EscrowStatisticsFields
    }}
}}
{escrow_statistics_fragment}
""".format(
    escrow_statistics_fragment=escrow_statistics_fragment
)


def get_event_day_data_query(param: StatisticsParam):
    return """
query GetEscrowDayData($from: Int, $to: Int) {{
    eventDayDatas(
        where: {{
            {from_clause}
            {to_clause}
        }},
        orderBy: timestamp,
        orderDirection: desc,
        {limit_clause}
    ) {{
      ...EventDayDataFields
    }}
}}
{event_day_data_fragment}
""".format(
        event_day_data_fragment=event_day_data_fragment,
        from_clause="timestamp_gte: $from" if param.date_from else "",
        to_clause="timestamp_lte: $to" if param.date_to else "",
        limit_clause="first: $limit" if param.limit else "first: 1000",
    )
