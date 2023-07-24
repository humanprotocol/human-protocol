import json
from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.modules.chain.web3 import get_web3
from src.constants import JobTypes


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
