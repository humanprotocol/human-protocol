"""Module containing all functions relating to blockchain operations."""

import json
from ast import literal_eval
from enum import Enum
from typing import Any

from eth_account.messages import encode_defunct
from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient, EscrowData
from pydantic import BaseModel
from src.config import BlockChainConfig, Config
from starlette.requests import Request
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

import jwt


class EventType(str, Enum):
    ESCROW_CREATED = "escrow_created"
    ESCROW_CANCELED = "escrow_canceled"


class EscrowInfo(BaseModel):
    """Specifies an escrow location.

    Attributes:
        chain_id: The id of the chain on which the escrow is located.
        escrow_address: The address of the escrow on the given chain.
        event_type: The type of event.
    """

    chain_id: int
    escrow_address: str
    event_type: EventType


def get_web3(chain_id: int):
    config: BlockChainConfig = Config.blockchain_config_from_id(chain_id)

    w3 = Web3(HTTPProvider(config.rpc_api))
    gas_payer = w3.eth.account.from_key(config.private_key)
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
    )
    w3.eth.default_account = gas_payer.address
    return w3


def serialize_message(message: Any) -> str:
    return json.dumps(message, separators=(",", ":"))


def sign_message(message, w3: Web3, private_key: str):
    serialized_message = serialize_message(message)
    signed_message = w3.eth.account.sign_message(
        encode_defunct(text=serialized_message), private_key
    )

    return signed_message.signature.hex(), serialized_message


def recover_signer(message, signature: str, w3: Web3) -> str:
    message_hash = encode_defunct(text=serialize_message(message))
    signer = w3.eth.account.recover_message(message_hash, signature=signature)
    return signer


def validate_address(escrow_address: str) -> str:
    if not Web3.isAddress(escrow_address):
        raise ValueError(f"{escrow_address} is not a correct Web3 address")
    return Web3.toChecksumAddress(escrow_address)


def get_manifest_url(info: EscrowInfo) -> str:
    escrow_client = EscrowClient(get_web3(chain_id=info.chain_id))
    return escrow_client.get_manifest_url(info.escrow_address)


def validate_escrow(
    escrow: EscrowData,
) -> bool:
    status = Status[escrow.status]
    if status != Status.Pending:
        raise ValueError(
            f"Escrow status must be {Status.Pending.value}, but was: {status.value}"
        )

    if int(escrow.balance) == 0:
        raise ValueError("Escrow doesn't have funds")

    return True


async def validate_job_launcher_signature(
    escrow_info: EscrowInfo, request: Request, signature: str, escrow: EscrowData
):
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))
    w3 = get_web3(escrow_info.chain_id)
    signer = recover_signer(message, signature, w3)
    return signer.lower() == escrow.launcher.lower()
