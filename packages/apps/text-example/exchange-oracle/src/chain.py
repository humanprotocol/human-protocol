"""Module containing all functions relating to blockchain operations."""
import json

from pydantic import BaseModel
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider
from eth_account.messages import encode_defunct
from human_protocol_sdk.escrow import EscrowClient

from src.config import BlockChainConfig, Config


class EscrowInfo(BaseModel):
    """Specifies an escrow location.

    Attributes:
        chain_id: The id of the chain on which the escrow is located.
        escrow_address: The address of the escrow on the given chain.
    """

    chain_id: int
    escrow_address: str


def get_network_config(chain_id: int) -> BlockChainConfig:
    network_configs: dict[int, BlockChainConfig] = {
        Config.polygon_mainnet.chain_id: Config.polygon_mainnet,
        Config.polygon_mumbai.chain_id: Config.polygon_mumbai,
        Config.localhost.chain_id: Config.localhost,
    }

    cfg = network_configs.get(chain_id)

    if cfg is None:
        raise ValueError(f"{chain_id} is not in available list of networks.")

    return cfg


def get_web3(chain_id: int):
    cfg = get_network_config(chain_id)
    w3 = Web3(HTTPProvider(cfg.rpc_api))
    gas_payer = w3.eth.account.from_key(cfg.private_key)
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
    )
    w3.eth.default_account = gas_payer.address
    return w3


def sign_message(chain_id: int, message) -> str:
    w3 = get_web3(chain_id)
    cfg = get_network_config(chain_id)
    private_key = cfg.private_key

    signed_message = w3.eth.account.sign_message(
        encode_defunct(text=json.dumps(message, separators=(",", ":"))), private_key
    )

    return signed_message.signature.hex()


def recover_signer(chain_id: int, message, signature: str) -> str:
    w3 = get_web3(chain_id)
    message_hash = encode_defunct(text=json.dumps(message, separators=(",", ":")))
    signer = w3.eth.account.recover_message(message_hash, signature=signature)
    return signer


def validate_address(escrow_address: str) -> str:
    if not Web3.isAddress(escrow_address):
        raise ValueError(f"{escrow_address} is not a correct Web3 address")
    return Web3.toChecksumAddress(escrow_address)


def get_manifest_url(info: EscrowInfo) -> str:
    escrow_client = EscrowClient(get_web3(chain_id=info.chain_id))
    return escrow_client.get_manifest_url(info.escrow_address)
