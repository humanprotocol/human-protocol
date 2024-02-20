from human_protocol_sdk.filter import PayoutFilter

payout_fragment = """
fragment PayoutFields on Payout {
    id
    escrowAddress
    recipient
    amount
    createdAt
}
"""


def get_payouts_query(filter: PayoutFilter):
    return """
query GetPayouts(
    $escrowAddress: String
    $recipient: String
    $from: Int
    $to: Int
) {{
    payouts(
      where: {{
        {escrow_address_clause}
        {recipient_clause}
        {from_clause}
        {to_clause}
      }}
    ) {{
      ...PayoutFields
    }}
}}
{payout_fragment}
""".format(
        payout_fragment=payout_fragment,
        escrow_address_clause=(
            "escrowAddress: $escrowAddress" if filter.escrow_address else ""
        ),
        recipient_clause="recipient: $recipient" if filter.recipient else "",
        from_clause="createdAt_gte: $from" if filter.date_from else "",
        to_clause="createdAt_lte: $to" if filter.date_from else "",
    )
