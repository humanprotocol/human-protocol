import json
from typing import List

from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.chain.web3 import get_web3


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: List[Status] = [Status.Pending],
    allow_no_funds: bool = False,
) -> None:
    assert accepted_states

    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    escrow_status = escrow_client.get_status(escrow_address)
    if escrow_status not in accepted_states:
        raise ValueError(
            "Escrow is not in any of the accepted states ({}). Current state: {}".format(
                ", ".join(s.name for s in accepted_states), escrow_status.name
            )
        )

    if escrow_status == Status.Pending and not allow_no_funds:
        if escrow_client.get_balance(escrow_address) == 0:
            raise ValueError("Escrow doesn't have funds")


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    return json.loads((StorageClient.download_file_from_url(manifest_url)).decode("utf-8"))


def get_job_launcher_address(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    job_launcher_address = escrow_client.get_job_launcher_address(escrow_address)

    return job_launcher_address


def get_recording_oracle_address(chain_id: int, escrow_address: str) -> str:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    recording_oracle_address = escrow_client.get_recording_oracle_address(escrow_address)

    return recording_oracle_address
