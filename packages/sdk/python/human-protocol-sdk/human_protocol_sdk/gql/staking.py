from human_protocol_sdk.staking import LeaderFilter

leader_fragment = """
fragment LeaderFields on Leader {
    id
    address
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountWithdrawn
    amountSlashed
    reputation
    reward
    amountJobsLaunched
    role
    fee
    publicKey
    webhookUrl
    url
}
"""


def get_leaders_query(filter: LeaderFilter):
    return """
query GetLeaders(
    $role: String
) {{
    leaders(
      where: {{
        {role_clause}
      }}
    ) {{
      ...LeaderFields
    }}
}}
{leader_fragment}
""".format(
        leader_fragment=leader_fragment,
        role_clause="role: $role" if filter.role else "",
    )


get_leader_query = """
query getLeader($address: String!) {{
    leader(id: $address) {{
      ...LeaderFields
    }}
}}
{leader_fragment}
""".format(
    leader_fragment=leader_fragment,
)
