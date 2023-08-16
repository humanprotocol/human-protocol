escrow_fragment = """
fragment EscrowFields on Escrow {{
    address
    amountPaid
    balance
    count
    factoryAddress
    finalResultsUrl
    id
    intermediateResultsUrl
    launcher
    manifestHash
    manifestUrl
    recordingOracle
    recordingOracleFee
    reputationOracle
    reputationOracleFee
    status
    token
    totalFundedAmount
}}
"""

get_escrows_by_launcher_query = """
query GetEscrowByLauncher($launcherAddress: String!) {{
    escrows(where: {{ launcher: $launcherAddress }}) {{
        ...EscrowFields
    }}
}}
{escrow_fragment}
""".format(
    escrow_fragment=escrow_fragment
)

get_filtered_escrows_query = """
query GetFilteredEscrows(
    $launcherAddress: String
    $status: EscrowStatus
    $from: Int
    $to: Int
) {{
    escrows(
        where: {{
            launcher: $launcherAddress
            status: $status
            createdAt_gte: $from
            createdAt_lte: $to
        }}
    ) {{
        ...EscrowFields
    }}
}}
{escrow_fragment}
""".format(
    escrow_fragment=escrow_fragment
)
