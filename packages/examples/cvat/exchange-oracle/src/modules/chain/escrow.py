import json

from pydantic import validator
from web3 import Web3

from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.modules.chain.web3 import get_web3


def validate_address(escrow_address: str):
    if not Web3.isAddress(escrow_address):
        raise ValueError(f"{escrow_address} is not a correct Web3 address")
    return Web3.toChecksumAddress(escrow_address)


def validate_escrow(network_id: int, escrow_address: str):
    web3 = get_web3(network_id)
    escrow_client = EscrowClient(web3)

    if escrow_client.get_balance(escrow_address) == 0:
        raise ValueError("Escrow doesn't have funds.")

    escrow_status = escrow_client.get_status(escrow_address)
    if escrow_status != Status.Pending:
        raise ValueError(
            f"Escrow is not in a Pending state. Current state: {escrow_status.name}."
        )


def get_escrow_manifest(network_id: int, escrow_address: str):
    web3 = get_web3(network_id)
    escrow_client = EscrowClient(web3)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    return json.loads(
        (StorageClient.download_file_from_url(manifest_url)).decode("utf-8")
    )
