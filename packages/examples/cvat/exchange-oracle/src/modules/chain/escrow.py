import json

from web3 import Web3

from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.modules.chain.web3 import get_web3


def validate_escrow(chain_id: int, escrow_address: str) -> None:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    if escrow_client.get_balance(escrow_address) == 0:
        raise ValueError("Escrow doesn't have funds")

    escrow_status = escrow_client.get_status(escrow_address)
    if escrow_status != Status.Pending:
        raise ValueError(
            f"Escrow is not in a Pending state. Current state: {escrow_status.name}"
        )


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    return json.loads(
        (StorageClient.download_file_from_url(manifest_url)).decode("utf-8")
    )


def store_results(chain_id: int, escrow_address: str, url: str, hash: str) -> None:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    escrow_client.store_results(escrow_address, url, hash)


def get_job_launcher_address(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    # TODO: Replace it with escrow_client.get_job_launcher_address(escrow_address) when this will be released
    contract = escrow_client._get_escrow_contract(escrow_address)
    job_launcher_address = contract.functions.launcher().call()

    return job_launcher_address
