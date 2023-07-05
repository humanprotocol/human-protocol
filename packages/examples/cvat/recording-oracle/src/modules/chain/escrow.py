import json

from web3 import Web3

from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.modules.chain.web3 import get_web3
from src.constants import JobTypes


def validate_address(escrow_address: str):
    if not Web3.isAddress(escrow_address):
        raise ValueError(f"{escrow_address} is not a correct Web3 address")
    return Web3.toChecksumAddress(escrow_address)


def get_escrow_job_type(chain_id: int, escrow_address: str):
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    manifest = json.loads(
        (StorageClient.download_file_from_url(manifest_url)).decode("utf-8")
    )

    return manifest["requestType"]


def validate_escrow(chain_id: int, escrow_address: str):
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    if escrow_client.get_balance(escrow_address) == 0:
        raise ValueError("Escrow doesn't have funds")

    escrow_status = escrow_client.get_status(escrow_address)
    if escrow_status != Status.Pending:
        raise ValueError(
            f"Escrow is not in a Pending state. Current state: {escrow_status.name}"
        )

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    manifest = json.loads(
        (StorageClient.download_file_from_url(manifest_url)).decode("utf-8")
    )
    job_type = manifest["requestType"]
    if job_type not in JobTypes.__members__.values():
        raise ValueError(f"Oracle doesn't support job type {job_type}")


def get_intermediate_results_url(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    # Method yet to be released
    intermediate_results_url = escrow_client.get_intermediate_results_url(
        escrow_address
    )

    return intermediate_results_url


def get_intermediate_results(chain_id: int, escrow_address: str):
    intermediate_results_url = get_intermediate_results_url(chain_id, escrow_address)
    intermediate_results = json.loads(
        StorageClient.download_file_from_url(intermediate_results_url).decode("utf-8")
    )
    return intermediate_results


def store_results(chain_id: int, escrow_address: str, url: str, hash: str) -> None:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    escrow_client.store_results(escrow_address, url, hash)


def get_reputation_oracle_address(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    reputation_oracle_address = escrow_client.get_reputation_oracle_address(
        escrow_address
    )

    return reputation_oracle_address
