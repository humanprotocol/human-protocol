import json
from typing import Any

from eth_account.messages import encode_defunct
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.core.config import Config
from src.core.types import Networks


def get_web3(chain_id: Networks):
    match chain_id:
        case Config.polygon_mainnet.chain_id:
            w3 = Web3(HTTPProvider(Config.polygon_mainnet.rpc_api))
            gas_payer = w3.eth.account.from_key(Config.polygon_mainnet.private_key)
            w3.middleware_onion.add(
                construct_sign_and_send_raw_middleware(gas_payer),
                "construct_sign_and_send_raw_middleware",
            )
            w3.eth.default_account = gas_payer.address
            return w3
        case Config.polygon_amoy.chain_id:
            w3 = Web3(HTTPProvider(Config.polygon_amoy.rpc_api))
            gas_payer = w3.eth.account.from_key(Config.polygon_amoy.private_key)
            w3.middleware_onion.add(
                construct_sign_and_send_raw_middleware(gas_payer),
                "construct_sign_and_send_raw_middleware",
            )
            w3.eth.default_account = gas_payer.address
            return w3
        case Config.localhost.chain_id:
            w3 = Web3(HTTPProvider(Config.localhost.rpc_api))
            gas_payer = w3.eth.account.from_key(Config.localhost.private_key)
            w3.middleware_onion.add(
                construct_sign_and_send_raw_middleware(gas_payer),
                "construct_sign_and_send_raw_middleware",
            )
            w3.eth.default_account = gas_payer.address
            return w3
        case _:
            raise ValueError(f"{chain_id} is not in available list of networks.")


def serialize_message(message: Any) -> str:
    return json.dumps(message, separators=(",", ":"))


def sign_message(chain_id: Networks, message) -> str:
    w3 = get_web3(chain_id)
    private_key = ""
    match chain_id:
        case Config.polygon_mainnet.chain_id:
            private_key = Config.polygon_mainnet.private_key
        case Config.polygon_amoy.chain_id:
            private_key = Config.polygon_amoy.private_key
        case Config.localhost.chain_id:
            private_key = Config.localhost.private_key
        case _:
            raise ValueError(f"{chain_id} is not in available list of networks.")

    serialized_message = serialize_message(message)
    signed_message = w3.eth.account.sign_message(
        encode_defunct(text=serialized_message), private_key
    )

    return signed_message.signature.hex(), serialized_message


def recover_signer(chain_id: Networks, message, signature: str) -> str:
    w3 = get_web3(chain_id)
    message_hash = encode_defunct(text=serialize_message(message))
    signer = w3.eth.account.recover_message(message_hash, signature=signature)

    return signer


def validate_address(escrow_address: str) -> str:
    if not Web3.is_address(escrow_address):
        raise ValueError(f"{escrow_address} is not a correct Web3 address")
    return Web3.to_checksum_address(escrow_address)
