from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.kvstore import KVStoreClient

from src.modules.chain.web3 import get_web3


def get_reputation_oracle_url(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)
    kvstore_client = KVStoreClient(web3)

    reputation_oracle_address = escrow_client.get_reputation_oracle_address(
        escrow_address
    )
    url = kvstore_client.get(reputation_oracle_address, "webhook_url")

    return url
