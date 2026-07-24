from __future__ import annotations

import os
from typing import TYPE_CHECKING, TypeVar

from datumaro.util.image import IMAGE_EXTENSIONS

import src.cvat.api_calls as cvat_api
from src.chain.escrow import get_remaining_escrow_funds
from src.core.tasks import TaskTypes
from src.services.cloud import CloudProviders

if TYPE_CHECKING:
    from src.core.manifest import ManifestBase
    from src.core.manifest.v1 import JobManifest
    from src.services.cloud.utils import BucketAccessInfo

LABEL_TYPE_MAPPING = {
    TaskTypes.image_label_binary: cvat_api.LabelType.tag,
    TaskTypes.image_points: cvat_api.LabelType.points,
    TaskTypes.image_boxes: cvat_api.LabelType.rectangle,
    TaskTypes.image_polygons: cvat_api.LabelType.polygon,
    TaskTypes.image_boxes_from_points: cvat_api.LabelType.rectangle,
    TaskTypes.image_skeletons_from_boxes: cvat_api.LabelType.points,
}


T = TypeVar("T")


class _Undefined:
    def __bool__(self) -> bool:
        return False


unset = _Undefined()

MaybeUnset = T | _Undefined


def get_assignment_bounty(
    manifest: ManifestBase, escrow_address: str, chain_id: int, *, job_count: int
) -> str | None:
    match manifest.version:
        case 1:
            return str(manifest.job_bounty)
        case 2:
            return _get_assignment_bounty_from_escrow(escrow_address, chain_id, job_count)
        case _ as version:
            raise NotImplementedError(f"Unexpected manifest version '{version}'")


def _get_assignment_bounty_from_escrow(
    escrow_address: str, chain_id: int, job_count: int
) -> str | None:
    if not job_count:
        return None

    funds = get_remaining_escrow_funds(chain_id, escrow_address)
    if funds is None:
        return None

    return str(funds / job_count)


def is_image(path: str) -> bool:
    trunk, ext = os.path.splitext(os.path.basename(path))
    return trunk and ext.lower() in IMAGE_EXTENSIONS


def filter_image_files(data_filenames: list[str]) -> list[str]:
    return [fn for fn in data_filenames if is_image(fn)]


def strip_bucket_prefix(data_filenames: list[str], prefix: str) -> list[str]:
    return [os.path.relpath(fn, prefix) for fn in data_filenames]


def make_cvat_label_configuration(manifest: JobManifest) -> list[dict]:
    return [
        {
            "name": label.name,
            "type": LABEL_TYPE_MAPPING[manifest.annotation.type].value,
        }
        for label in manifest.annotation.labels
    ]


def make_cvat_cloud_storage_params(bucket_info: BucketAccessInfo) -> dict:
    CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER = {
        CloudProviders.aws: "AWS_S3_BUCKET",
        CloudProviders.gcs: "GOOGLE_CLOUD_STORAGE",
    }

    params = {
        "provider": CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[bucket_info.provider],
        "bucket_name": bucket_info.bucket_name,
        "bucket_host": bucket_info.host_url,
    }

    if bucket_info.credentials:
        params["credentials"] = bucket_info.credentials.to_dict()

    return params
