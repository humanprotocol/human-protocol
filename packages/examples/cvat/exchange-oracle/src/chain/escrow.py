import json
from typing import List

from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.storage import StorageClient


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: List[Status] = [Status.Pending],
    allow_no_funds: bool = False,
) -> None:
    assert accepted_states

    escrow = EscrowUtils.get_escrow(chain_id, escrow_address)

    if escrow.status not in accepted_states:
        raise ValueError(
            "Escrow is not in any of the accepted states ({}). Current state: {}".format(
                ", ".join(s.name for s in accepted_states), escrow.status.name
            )
        )

    if escrow.status == Status.Pending and not allow_no_funds:
        if escrow.balance == 0:
            raise ValueError("Escrow doesn't have funds")


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    escrow = EscrowUtils.get_escrow(chain_id, escrow_address)
    manifest_content = StorageClient.download_file_from_url(escrow.manifestUrl)
    return json.loads(manifest_content.decode("utf-8"))


def get_job_launcher_address(chain_id: int, escrow_address: str) -> str:
    return EscrowUtils.get_escrow(chain_id, escrow_address).launcher


def get_recording_oracle_address(chain_id: int, escrow_address: str) -> str:
    return EscrowUtils.get_escrow(chain_id, escrow_address).recordingOracle
