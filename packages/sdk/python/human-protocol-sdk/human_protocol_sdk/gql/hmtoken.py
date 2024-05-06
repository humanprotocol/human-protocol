holder_fragment = """
fragment HolderFields on Holder {
    address
    balance
}
"""

get_holders_query = """
query GetHolders {{
    holders {{
        ...HolderFields
    }}
}}
{holder_fragment}
""".format(
    holder_fragment=holder_fragment
)
