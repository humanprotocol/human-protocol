from human_protocol_sdk.kvstore import KVStoreClient
from web3 import HTTPProvider, Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder

from tests.utils.constants import REPUTATION_ORACLE_PRIV

amount = Web3.to_wei(1, "ether")


def store_kvstore_value(key: str, value: str):
    w3 = Web3(HTTPProvider())

    # Set default gas payer
    reputation_oracle = w3.eth.account.from_key(REPUTATION_ORACLE_PRIV)
    w3.middleware_onion.inject(
                SignAndSendRawMiddlewareBuilder.build(REPUTATION_ORACLE_PRIV), # type: ignore
                'SignAndSendRawMiddlewareBuilder',
                layer=0,
            )
    w3.eth.default_account = reputation_oracle.address
    kvstore_client = KVStoreClient(w3)
    kvstore_client.set(key, value)
