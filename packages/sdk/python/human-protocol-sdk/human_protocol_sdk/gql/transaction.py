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
    from_address = filter.from_address
    to_address = filter.to_address

    if from_address == to_address:
        address_condition = f"""
        {f'{{ from: $fromAddress }}' if from_address else ''}
        {f'{{ to: $toAddress }}' if to_address else ''}
        """
    else:
        address_condition = f"""
        {f'from: $fromAddress' if from_address else ''}
        {f'to: $toAddress' if to_address else ''}
        """

    where_clause = f"""
    where: {{
        {"or: [" + address_condition + "]," if from_address == to_address else address_condition}
        {f'timestamp_gte: $startDate,' if filter.start_date else ''}
        {f'timestamp_lte: $endDate,' if filter.end_date else ''}
        {f'block_gte: $startBlock,' if filter.start_block else ''}
        {f'block_lte: $endBlock,' if filter.end_block else ''}
    }}
    """

    return f"""
query GetTransactions(
    $fromAddress: String
    $toAddress: String
    $startDate: Int
    $endDate: Int
    $startBlock: Int
    $endBlock: Int
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    transactions(
        {where_clause}
        orderBy: timestamp,
        orderDirection: $orderDirection,
        first: $first,
        skip: $skip
    ) {{
        ...TransactionFields
    }}
}}
{transaction_fragment}
"""


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
