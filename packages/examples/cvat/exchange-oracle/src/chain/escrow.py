import json
from typing import List

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowData, EscrowUtils
from human_protocol_sdk.storage import StorageClient

from src.services.cloud.types import BucketAccessInfo


def get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
    escrow = EscrowUtils.get_escrow(ChainId(chain_id), escrow_address)
    if not escrow:
        raise Exception(f"Can't find escrow {escrow_address}")

    return escrow


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: List[Status] = [Status.Pending],
    allow_no_funds: bool = False,
) -> None:
    assert accepted_states

    escrow = get_escrow(chain_id, escrow_address)

    status = Status[escrow.status]
    if status not in accepted_states:
        raise ValueError(
            "Escrow is not in any of the accepted states ({}). Current state: {}".format(
                ", ".join(s.name for s in accepted_states), status.name
            )
        )

    if status == Status.Pending and not allow_no_funds:
        if int(escrow.balance) == 0:
            raise ValueError("Escrow doesn't have funds")


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    escrow = get_escrow(chain_id, escrow_address)

    bucket_info = BucketAccessInfo.parse_obj(escrow.manifest_url)

    secure = False
    if bucket_info.host_url.startswith("https://"):
        host = bucket_info.host_url[len("https://") :]
        secure = True
    elif bucket_info.host_url.startswith("http://"):
        host = bucket_info.host_url[len("http://") :]
    else:
        host = bucket_info.host_url

    manifest_content = StorageClient(endpoint_url=host, secure=secure).download_files(
        [bucket_info.path], bucket=bucket_info.bucket_name
    )[0]

    return json.loads(manifest_content.decode("utf-8"))


def get_job_launcher_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).launcher


def get_recording_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).recording_oracle
