import datetime
import json
from typing import List

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowClient, EscrowData, EscrowUtils
from human_protocol_sdk.storage import StorageClient

from src.chain.web3 import get_web3
from src.services.cloud.types import BucketAccessInfo


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

    bucket_access_info = BucketAccessInfo.parse_obj(escrow.manifest_url)

    secure = False
    if bucket_access_info.host_url.startswith("https://"):
        host = bucket_access_info.host_url[len("https://") :]
        secure = True
    elif bucket_access_info.host_url.startswith("http://"):
        host = bucket_access_info.host_url[len("http://") :]
    else:
        host = bucket_access_info.host_url

    manifest_content = StorageClient(endpoint_url=host, secure=secure).download_files(
        [bucket_access_info.path], bucket=bucket_access_info.bucket_name
    )[0]
    return json.loads(manifest_content.decode("utf-8"))


def store_results(chain_id: int, escrow_address: str, url: str, hash: str) -> None:
    # TODO: remove mock
    if escrow_address.startswith("test-"):
        return

    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    escrow_client.store_results(escrow_address, url, hash)


def get_reputation_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).reputation_oracle


def get_exchange_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).exchange_oracle
