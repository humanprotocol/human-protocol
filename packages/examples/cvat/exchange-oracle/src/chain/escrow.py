import datetime
import json
from typing import List

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowData, EscrowUtils
from human_protocol_sdk.storage import StorageClient

from src.services.cloud.utils import parse_bucket_url


def get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
    # TODO: remove mock
    if escrow_address.startswith("test-"):
        from human_protocol_sdk.constants import ChainId

        return EscrowData(
            chain_id=ChainId(chain_id),
            id="test",
            address=escrow_address,
            amount_paid=10,
            balance=10,
            count=1,
            factory_address="",
            launcher="",
            status="Pending",
            token="HMT",
            total_funded_amount=10,
            created_at=datetime.datetime(2023, 1, 1),
            manifest_url="http://127.0.0.1:9010/manifests/manifest_boxes_from_points_local.json",
        )

    escrow = EscrowUtils.get_escrow(chain_id, escrow_address.lower())
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

    parsed_url = parse_bucket_url(escrow.manifest_url)

    secure = False
    if parsed_url.host_url.startswith("https://"):
        host = parsed_url.host_url[len("https://") :]
        secure = True
    elif parsed_url.host_url.startswith("http://"):
        host = parsed_url.host_url[len("http://") :]
    else:
        host = parsed_url.host_url

    manifest_content = StorageClient(endpoint_url=host, secure=secure).download_files(
        [parsed_url.path], bucket=parsed_url.bucket_name
    )[0]
    return json.loads(manifest_content.decode("utf-8"))


def get_job_launcher_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).launcher


def get_recording_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).recording_oracle
