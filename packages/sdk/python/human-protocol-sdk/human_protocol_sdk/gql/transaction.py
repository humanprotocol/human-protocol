from human_protocol_sdk.filter import TransactionFilter

transaction_fragment = """
fragment TransactionFields on Transaction {
    block
    txHash
    from
    to
    timestamp
    value
    method
}
"""


def get_transactions_query(filter: TransactionFilter) -> str:
    return """
query GetTransactions(
    $fromAddress: String
    $toAddress: String
    $startDate: Int
    $endDate: Int
    $startBlock: Int
    $endBlock: Int
) {{
    transactions(
        where: {{
        {from_address_clause}
        {to_address_clause}
        {start_date_clause}
        {end_date_clause}
        {start_block_clause}
        {end_block_clause}
        }}
        orderBy: timestamp,
        orderDirection: asc,
    ) {{
        ...TransactionFields
    }}
}}
{transaction_fragment}
""".format(
        transaction_fragment=transaction_fragment,
        from_address_clause="from: $fromAddress" if filter.from_address else "",
        to_address_clause="to: $toAddress" if filter.to_address else "",
        start_date_clause="timestamp_gte: $startDate" if filter.start_date else "",
        end_date_clause="timestamp_lte: $endDate" if filter.end_date else "",
        start_block_clause="block_gte: $startBlock" if filter.start_block else "",
        end_block_clause="block_lte: $endBlock" if filter.end_block else "",
    )


def get_transaction_query() -> str:
    return """
query GetTransaction(
    $hash: String!
) {{
    transaction(id: $hash) {{
        ...TransactionFields
    }}
}}
{transaction_fragment}
""".format(
        transaction_fragment=transaction_fragment
    )
