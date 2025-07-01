from human_protocol_sdk.filter import StakersFilter

STAKER_FRAGMENT = """
fragment StakerFields on Staker {
    id
    address
    stakedAmount
    lockedAmount
    withdrawnAmount
    slashedAmount
    lockedUntilTimestamp
    lastDepositTimestamp
}
"""


def get_stakers_query(filter: StakersFilter) -> str:
    where_fields = []
    if filter.min_staked_amount:
        where_fields.append("stakedAmount_gte: $minStakedAmount")
    if filter.max_staked_amount:
        where_fields.append("stakedAmount_lte: $maxStakedAmount")
    if filter.min_locked_amount:
        where_fields.append("lockedAmount_gte: $minLockedAmount")
    if filter.max_locked_amount:
        where_fields.append("lockedAmount_lte: $maxLockedAmount")
    if filter.min_withdrawn_amount:
        where_fields.append("withdrawnAmount_gte: $minWithdrawnAmount")
    if filter.max_withdrawn_amount:
        where_fields.append("withdrawnAmount_lte: $maxWithdrawnAmount")
    if filter.min_slashed_amount:
        where_fields.append("slashedAmount_gte: $minSlashedAmount")
    if filter.max_slashed_amount:
        where_fields.append("slashedAmount_lte: $maxSlashedAmount")

    where_clause = f"where: {{ {', '.join(where_fields)} }}" if where_fields else ""

    return f"""
query GetStakers(
    $minStakedAmount: BigInt
    $maxStakedAmount: BigInt
    $minLockedAmount: BigInt
    $maxLockedAmount: BigInt
    $minWithdrawnAmount: BigInt
    $maxWithdrawnAmount: BigInt
    $minSlashedAmount: BigInt
    $maxSlashedAmount: BigInt
    $orderBy: Staker_orderBy
    $orderDirection: OrderDirection
    $first: Int
    $skip: Int
) {{
    stakers(
        {where_clause}
        orderBy: $orderBy
        orderDirection: $orderDirection
        first: $first
        skip: $skip
    ) {{
        ...StakerFields
    }}
}}
{STAKER_FRAGMENT}
"""


def get_staker_query() -> str:
    return f"""
query GetStaker($id: String!) {{
    staker(id: $id) {{
        ...StakerFields
    }}
}}
{STAKER_FRAGMENT}
"""
