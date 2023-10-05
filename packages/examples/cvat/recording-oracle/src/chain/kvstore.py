from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.kvstore import KVStoreClient

from src.chain.web3 import get_web3
from src.core.config import Config


def get_role_by_address(chain_id: int, address: str) -> str:
    web3 = get_web3(chain_id)
    kvstore_client = KVStoreClient(web3)

    role = kvstore_client.get(address, "role")

    return role


def get_exchange_oracle_url(chain_id: int, escrow_address: str) -> str:
    # TODO: remove mock (not implemented yet)
    url = Config.localhost.exchange_oracle_url
    assert url
    return url

    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)
    kvstore_client = KVStoreClient(web3)

    exchange_oracle_address = escrow_client.get_exchange_oracle_address(escrow_address)
    url = kvstore_client.get(exchange_oracle_address, "webhook_url")

    return url


def get_reputation_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.reputation_oracle_url:
        return url

    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)
    kvstore_client = KVStoreClient(web3)

    reputation_oracle_address = escrow_client.get_reputation_oracle_address(escrow_address)
    url = kvstore_client.get(reputation_oracle_address, "webhook_url")

    return url
