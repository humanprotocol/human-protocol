from web3 import Web3, HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware
from human_protocol_sdk.kvstore import KVStoreClient
from tests.utils.constants import RECORDING_ORACLE_PRIV

amount = Web3.toWei(1, "ether")


def store_kvstore_value(value: str):
    w3 = Web3(HTTPProvider())

    # Set default gas payer
    recording_oracle = w3.eth.account.from_key(RECORDING_ORACLE_PRIV)
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(recording_oracle),
        "construct_sign_and_send_raw_middleware",
    )
    w3.eth.default_account = recording_oracle.address
    kvstore_client = KVStoreClient(w3)
    kvstore_client.set("webhook_url", value)
