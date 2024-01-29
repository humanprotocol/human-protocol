from human_protocol_sdk.kvstore import KVStoreClient
from human_protocol_sdk.staking import StakingClient

from src.chain.escrow import get_escrow
from src.chain.web3 import get_web3
from src.core.config import Config


def get_role_by_address(chain_id: int, address: str) -> str:
    web3 = get_web3(chain_id)
    kvstore_client = KVStoreClient(web3)

    role = kvstore_client.get(address, "role")

    return role


def get_exchange_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.exchange_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    web3 = get_web3(chain_id)
    staking_client = StakingClient(web3)
    return staking_client.get_leader(escrow.exchange_oracle)["webhook_url"]


def get_reputation_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.reputation_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    web3 = get_web3(chain_id)
    staking_client = StakingClient(web3)
    return staking_client.get_leader(escrow.reputation_oracle)["webhook_url"]
