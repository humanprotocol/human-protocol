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
    receiver
    escrow
    token
    internalTransactions {
      from
      id
      to
      value
      receiver
      escrow
      token
      method
    }
}
"""


def get_transactions_query(filter: TransactionFilter) -> str:
    start_date = filter.start_date
    end_date = filter.end_date
    start_block = filter.start_block
    end_block = filter.end_block
    from_address = filter.from_address
    to_address = filter.to_address
    method = filter.method
    escrow = filter.escrow
    token = filter.token

    address_condition = (
        f"""
        {f'{{ from: $fromAddress }}' if from_address else ''}
        {f'{{ or: [{{ or: [{{ to: $toAddress }}, {{ receiver: $toAddress }}] }}, {{ internalTransactions_: {{ or: [{{ to: $toAddress }}, {{ receiver: $toAddress }}] }} }}] }}' if to_address else ''}
        """
        if from_address == to_address
        else f"""
        {f'{{ from: $fromAddress }}' if from_address else ''}
        {f'{{ or: [{{ or: [{{ to: $toAddress }}, {{ receiver: $toAddress }}] }}, {{ internalTransactions_: {{ or: [{{ to: $toAddress }}, {{ receiver: $toAddress }}] }} }}] }}' if to_address else ''}
        """
    )

    where_clause = f"""
    where: {{
        and: [
            {f'{{ or: [ {address_condition} ] }},' if from_address and from_address == to_address else address_condition}
            {f'{{ timestamp_gte: $startDate }},' if start_date else ''}
            {f'{{ timestamp_lte: $endDate }},' if end_date else ''}
            {f'{{ block_gte: $startBlock }},' if start_block else ''}
            {f'{{ block_lte: $endBlock }},' if end_block else ''}
            {f'{{ method: $method }},' if method else ''}
            {f'{{ escrow: $escrow }},' if escrow else ''}
            {f'{{ token: $token }}' if token else ''}
        ]
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
    $method: String
    $escrow: String
    $token: String
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
