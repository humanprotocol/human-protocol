from human_protocol_sdk.filter import StatisticsFilter

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
    dailyUniqueSenders
    dailyUniqueReceivers
}
"""

hmt_statistics_id = "hmt-statistics-id".encode("utf-8").hex()
escrow_statistics_id = "escrow-statistics-id".encode("utf-8").hex()

# Inserta los valores hexadecimales en la consulta GraphQL
get_hmtoken_statistics_query = f"""
query GetHMTokenStatistics {{
    hmtokenStatistics(id: "{hmt_statistics_id}") {{
        ...HMTokenStatisticsFields
    }}
}}
{hmtoken_statistics_fragment}
"""

get_escrow_statistics_query = f"""
query GetEscrowStatistics {{
    escrowStatistics(id: "{escrow_statistics_id}") {{
        ...EscrowStatisticsFields
    }}
}}
{escrow_statistics_fragment}
"""


def get_event_day_data_query(filter: StatisticsFilter) -> str:
    return """
query GetEscrowDayData(
    $from: Int
    $to: Int
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    eventDayDatas(
        where: {{
            {from_clause}
            {to_clause}
        }},
        orderBy: timestamp,
        orderDirection: $orderDirection
        first: $first
        skip: $skip
    ) {{
      ...EventDayDataFields
    }}
}}
{event_day_data_fragment}
""".format(
        event_day_data_fragment=event_day_data_fragment,
        from_clause="timestamp_gte: $from" if filter.date_from else "",
        to_clause="timestamp_lte: $to" if filter.date_to else "",
    )
