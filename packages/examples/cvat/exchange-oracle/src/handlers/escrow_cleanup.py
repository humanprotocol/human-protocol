from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING

from cvat_sdk.api_client.exceptions import NotFoundException

import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
from src.core.config import Config
from src.core.storage import (
    compose_data_bucket_prefix,
    compose_results_bucket_prefix,
)
from src.services.cloud.utils import BucketAccessInfo

if TYPE_CHECKING:
    from src.models.cvat import Project


def _cleanup_cvat(projects: list[Project]) -> None:
    deleted_cloud_storage_ids = set()
    for project in projects:
        if (
            project.cvat_cloudstorage_id is not None
            and project.cvat_cloudstorage_id not in deleted_cloud_storage_ids
        ):
            with contextlib.suppress(NotFoundException):
                # probably will allways call this just once
                cvat_api.delete_cloudstorage(project.cvat_cloudstorage_id)
            deleted_cloud_storage_ids.add(project.cvat_cloudstorage_id)
        if project.cvat_id is not None:
            with contextlib.suppress(NotFoundException):
                cvat_api.delete_project(project.cvat_id)


def _cleanup_storage(escrow_address: str, chain_id: int) -> None:
    storage_client = cloud_service.make_client(BucketAccessInfo.parse_obj(Config.storage_config))
    storage_client.remove_files(
        prefix=compose_data_bucket_prefix(escrow_address, chain_id),
    )
    storage_client.remove_files(
        prefix=compose_results_bucket_prefix(escrow_address, chain_id),
    )


def cleanup_escrow(escrow_address: str, chain_id: int, projects: list[Project]) -> None:
    """
    Cleans up CVAT resources and storage related to the given escrow.
    """
    _cleanup_cvat(projects)
    _cleanup_storage(escrow_address, chain_id)
