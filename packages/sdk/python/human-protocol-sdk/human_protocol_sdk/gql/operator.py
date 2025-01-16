from typing import Optional

from human_protocol_sdk.operator import LeaderFilter

leader_fragment = """
fragment LeaderFields on Leader {
    id
    address
    amountStaked
    amountLocked
    lockedUntilTimestamp
    amountWithdrawn
    amountSlashed
    reward
    amountJobsProcessed
    role
    fee
    publicKey
    webhookUrl
    url
    website
    jobTypes
    registrationNeeded
    registrationInstructions
    reputationNetworks {
      address
    }
    name
    category
}
"""


def get_leaders_query(filter: LeaderFilter):
    return """
query GetLeaders(
    $minAmountStaked: Int,
    $roles: [String!]
    $orderBy: String
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    leaders(
      where: {{
        {amount_staked_clause}
        {roles_clause}
      }},
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
      skip: $skip
    ) {{
      ...LeaderFields
    }}
}}
{leader_fragment}
""".format(
        leader_fragment=leader_fragment,
        amount_staked_clause=(
            "amountStaked_gte: $minAmountStaked" if filter.min_amount_staked else ""
        ),
        roles_clause="role_in: $roles" if filter.roles else "",
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


def get_reputation_network_query(role: Optional[str]):
    return """
query getReputationNetwork(
  $address: String,
  $role: String
) {{
  reputationNetwork(id: $address) {{
    operators(
      where: {{
        {role_clause}
      }} 
    ) {{
      address,
      role,
      url,
      jobTypes,
      registrationNeeded,
      registrationInstructions

    }}
  }}
}}
""".format(
        role_clause="role: $role" if role else "",
    )
