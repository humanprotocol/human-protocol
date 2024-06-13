kvstore_fragment = """
fragment KVStoreFields on KVStore {
    id
    block
    timestamp
    address
    key
    value
}
"""


def get_kvstore_by_address_query() -> str:
    return f"""
query getKVStoreData($address: String!) {{
    kvstores(
        where: {{
            address: $address
        }}
    ) {{
      ...KVStoreFields
    }}
}}
{kvstore_fragment}
"""
