from __future__ import annotations

import contextlib
import logging
from typing import TYPE_CHECKING

from cvat_sdk.api_client.exceptions import NotFoundException

import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
from src.core.config import Config
from src.core.storage import (
    compose_data_bucket_prefix,
    compose_results_bucket_prefix,
)
from src.log import get_logger_name
from src.services.cloud.utils import BucketAccessInfo

if TYPE_CHECKING:
    from collections.abc import Generator

    from src.models.cvat import Project

logger = logging.getLogger(get_logger_name(__name__))


@contextlib.contextmanager
def _log_error(errors_container: list[Exception], message: str) -> Generator[None, None, None]:
    try:
        yield
    except Exception as e:
        errors_container.append(e)
        logger.exception(message)


def _cleanup_cvat(projects: list[Project]) -> None:
    """
    CVAT can throw a timeout error or 500 status code unexpectedly.

    We don't want these errors affecting deletion of other projects, but want to reraise them,
    so we'll be able to retry later.

    We also want to ignore NotFoundException since project might have been deleted manually
    or on the previous attempt.
    """
    cloud_storage_ids_to_delete = set()  # probably will allways have one element
    errors = []
    for project in projects:
        cloud_storage_ids_to_delete.add(project.cvat_cloudstorage_id)
        if project.cvat_id is not None:
            with (
                _log_error(
                    errors, f"Encountered error while deliting CVAT project {project.cvat_id}"
                ),
                contextlib.suppress(NotFoundException),
            ):
                cvat_api.delete_project(project.cvat_id)

    for cloud_storage_id in cloud_storage_ids_to_delete:
        with (
            _log_error(
                errors, f"Encountered error while deleting CVAT cloudstorage {cloud_storage_id}"
            ),
            contextlib.suppress(NotFoundException),
        ):
            cvat_api.delete_cloudstorage(cloud_storage_id)

    if errors:
        raise RuntimeError(
            f"Encountered {len(errors)} error(s) while deleting CVAT projects. "
            "All errors have been logged.",
            errors,
        )


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
    try:
        _cleanup_cvat(projects)
    finally:
        # in case both _cleanup_cvat and _cleanup_storage raise an exception,
        # both will be in the traceback
        _cleanup_storage(escrow_address, chain_id)
