holder_fragment = """
fragment HolderFields on Holder {
    address
    balance
}
"""


def get_holders_query(address: str = None):
    return """
query GetHolders(
    $address: String
    $orderBy: String
    $orderDirection: String
) {{
    holders(
      where: {{
        {address_clause}
      }}
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {{
      ...HolderFields
    }}
}}
{holder_fragment}
""".format(
        holder_fragment=holder_fragment,
        address_clause="address: $address" if address else "",
    )
