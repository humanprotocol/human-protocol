from human_protocol_sdk.kvstore import KVStoreClient

from src.modules.chain.web3 import get_web3


def get_reputation_oracle_url(chain_id: int, reputation_oracle_address: str) -> str:
    web3 = get_web3(chain_id)
    kvstore_client = KVStoreClient(web3)

    url = kvstore_client.get(reputation_oracle_address, "webhook_url")

    return url


def get_role_by_address(chain_id: int, address: str) -> str:
    web3 = get_web3(chain_id)
    kvstore_client = KVStoreClient(web3)

    role = kvstore_client.get(address, "role")

    return role
