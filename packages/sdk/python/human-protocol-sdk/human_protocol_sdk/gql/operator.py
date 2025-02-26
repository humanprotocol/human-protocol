from typing import Optional

from human_protocol_sdk.operator import OperatorFilter

operator_fragment = """
fragment OperatorFields on Operator {
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


def get_operators_query(filter: OperatorFilter):
    return """
query GetOperators(
    $minAmountStaked: Int,
    $roles: [String!]
    $orderBy: String
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    operators(
      where: {{
        {amount_staked_clause}
        {roles_clause}
      }},
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
      skip: $skip
    ) {{
      ...OperatorFields
    }}
}}
{operator_fragment}
""".format(
        operator_fragment=operator_fragment,
        amount_staked_clause=(
            "amountStaked_gte: $minAmountStaked" if filter.min_amount_staked else ""
        ),
        roles_clause="role_in: $roles" if filter.roles else "",
    )


get_operator_query = """
query getOperator($address: String!) {{
    operator(id: $address) {{
      ...OperatorFields
    }}
}}
{operator_fragment}
""".format(
    operator_fragment=operator_fragment,
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
      ...OperatorFields
    }}
  }}
}}
{operator_fragment}
""".format(
        operator_fragment=operator_fragment,
        role_clause="role: $role" if role else "",
    )
