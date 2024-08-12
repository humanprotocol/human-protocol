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


def get_kvstore_by_address_and_key_query() -> str:
    return f"""
query getKVStoreDataByKey($address: String!, $key: String!) {{
    kvstores(
        where: {{
            address: $address,
            key: $key
        }}
    ) {{
      ...KVStoreFields
    }}
}}
{kvstore_fragment}
"""
