from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from web3 import Web3


def get_escrow_manifest(web3: Web3, escrow_address: str):
    escrow_client = EscrowClient(web3)

    check_escrow(web3, escrow_address)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    return StorageClient.download_file_from_url(manifest_url)


def check_escrow(web3: Web3, escrow_address: str):
    escrow_client = EscrowClient(web3)

    if escrow_client.get_balance(escrow_address) == 0:
        raise Exception("Escrow out of balance")

    if escrow_client.get_status(escrow_address) != Status.Pending:
        raise Exception("Escrow is not pending")
