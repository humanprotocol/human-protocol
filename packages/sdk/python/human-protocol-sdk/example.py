from eth_typing import URI
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.staking import StakingClient
from human_protocol_sdk.kvstore import KVStoreClient


def get_w3_with_priv_key(priv_key: str):
    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key(priv_key)
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.inject(
        SignAndSendRawMiddlewareBuilder.build(priv_key),
        "SignAndSendRawMiddlewareBuilder",
        layer=0,
    )
    return (w3, gas_payer)


(w3, gas_payer) = get_w3_with_priv_key(
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
)
escrow_client = EscrowClient(w3)

staking_client = StakingClient(w3)

kvstore_client = KVStoreClient(w3)

kvstore_client.set("test", "value")

staking_client.approve_stake(10000)
staking_client.stake(10000)
amount = Web3.to_wei(5, "ether")  # convert from ETH to WEI
transaction = escrow_client.create_escrow(
    "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
    ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
    "1",
)
print(f"Transaction hash: {transaction}")
