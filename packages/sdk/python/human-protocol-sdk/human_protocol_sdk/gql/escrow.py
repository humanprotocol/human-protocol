from human_protocol_sdk.filter import EscrowFilter

escrow_fragment = """
fragment EscrowFields on Escrow {
    address
    amountPaid
    balance
    count
    factoryAddress
    finalResultsUrl
    id
    intermediateResultsUrl
    launcher
    jobRequesterId
    manifestHash
    manifestUrl
    recordingOracle
    recordingOracleFee
    reputationOracle
    reputationOracleFee
    exchangeOracle
    exchangeOracleFee
    status
    token
    totalFundedAmount
    createdAt
}
"""


def get_escrows_query(filter: EscrowFilter):
    return """
query GetEscrows(
    $launcher: String
    $reputationOracle: String
    $recordingOracle: String
    $exchangeOracle: String
    $jobRequesterId: String
    $status: String
    $from: Int
    $to: Int
) {{
    escrows(
      where: {{
        {launcher_clause}
        {reputation_oracle_clause}
        {recording_oracle_clause}
        {exchange_oracle_clause}
        {job_requester_clause}
        {status_clause}
        {from_clause}
        {to_clause}
      }}
    ) {{
      ...EscrowFields
    }}
}}
{escrow_fragment}
""".format(
        escrow_fragment=escrow_fragment,
        launcher_clause="launcher: $launcher" if filter.launcher else "",
        reputation_oracle_clause=(
            "reputationOracle: $reputationOracle" if filter.reputation_oracle else ""
        ),
        recording_oracle_clause=(
            "recordingOracle: $recordingOracle" if filter.recording_oracle else ""
        ),
        exchange_oracle_clause=(
            "exchangeOracle: $exchangeOracle" if filter.exchange_oracle else ""
        ),
        job_requester_clause=(
            "jobRequesterId: $jobRequesterId" if filter.job_requester_id else ""
        ),
        status_clause="status: $status" if filter.status else "",
        from_clause="createdAt_gte: $from" if filter.date_from else "",
        to_clause="createdAt_lte: $to" if filter.date_from else "",
    )


def get_escrow_query():
    return """
query GetEscrow(
    $escrowAddress: String!
) {{
    escrow(id: $escrowAddress) {{
      ...EscrowFields
    }}
}}
{escrow_fragment}
""".format(
        escrow_fragment=escrow_fragment
    )
