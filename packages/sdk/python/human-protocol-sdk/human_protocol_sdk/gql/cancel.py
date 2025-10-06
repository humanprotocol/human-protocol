cancellation_refund_fragment = """
fragment CancellationRefundFields on CancellationRefundEvent {
    id
    escrowAddress
    receiver
    amount
    block
    timestamp
    txHash
}
"""


def get_cancellation_refunds_query(filter):
    return """
query GetCancellationRefundEvents(
    $escrowAddress: String
    $receiver: String
    $from: Int
    $to: Int
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    cancellationRefundEvents(
        where: {{
            {escrow_address_clause}
            {receiver_clause}
            {from_clause}
            {to_clause}
        }}
        orderBy: timestamp
        orderDirection: $orderDirection
        first: $first
        skip: $skip
    ) {{
        ...CancellationRefundFields
    }}
}}
{cancellation_refund_fragment}
""".format(
        cancellation_refund_fragment=cancellation_refund_fragment,
        escrow_address_clause=(
            "escrowAddress: $escrowAddress"
            if getattr(filter, "escrow_address", None)
            else ""
        ),
        receiver_clause=(
            "receiver: $receiver" if getattr(filter, "receiver", None) else ""
        ),
        from_clause=(
            "timestamp_gte: $from" if getattr(filter, "date_from", None) else ""
        ),
        to_clause="timestamp_lte: $to" if getattr(filter, "date_to", None) else "",
    )


def get_cancellation_refund_by_escrow_query():
    return """
query GetCancellationRefundEventByEscrow(
    $escrowAddress: String!
) {{
    cancellationRefundEvents(
        where: {{ escrowAddress: $escrowAddress }}
        orderBy: timestamp
        orderDirection: desc
        first: 1
    ) {{
        ...CancellationRefundFields
    }}
}}
{cancellation_refund_fragment}
""".format(
        cancellation_refund_fragment=cancellation_refund_fragment
    )
