"""Shared result/metafile primitives for escrow export and validation flows."""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import TYPE_CHECKING

import src.services.cloud as cloud_service
from src.core.annotation_meta import (
    ANNOTATION_RESULTS_METAFILE_NAME,
    RESULTING_ANNOTATIONS_FILE,
    AnnotationMeta,
    JobMeta,
)
from src.core.config import StorageConfig
from src.core.storage import compose_results_bucket_filename
from src.services.cloud.types import BucketAccessInfo

if TYPE_CHECKING:
    from collections.abc import Sequence

    from src.models.cvat import Job


@dataclass
class FileDescriptor:
    filename: str
    file: io.RawIOBase | None


def prepare_annotation_metafile(jobs: list[Job]) -> FileDescriptor:
    """
    Prepares a task/project annotation descriptor file with annotator mapping.
    """

    meta = AnnotationMeta(
        jobs=[
            JobMeta(
                job_id=job.cvat_id,
                annotator_wallet_address=job.latest_assignment.user_wallet_address,
                assignment_id=job.latest_assignment.id,
                task_id=job.cvat_task_id,
                start_frame=job.start_frame,
                stop_frame=job.stop_frame,
            )
            for job in jobs
        ]
    )

    return FileDescriptor(
        ANNOTATION_RESULTS_METAFILE_NAME, file=io.BytesIO(meta.model_dump_json().encode())
    )


def upload_escrow_results(
    files: Sequence[FileDescriptor], chain_id: int, escrow_address: str
) -> None:
    storage_info = BucketAccessInfo.parse_obj(StorageConfig)
    storage_client = cloud_service.make_client(storage_info)

    # always update annotation meta and resulting annotations files
    # to have actual data for the current epoch
    existing_storage_files = set(
        storage_client.list_files(
            prefix=compose_results_bucket_filename(escrow_address, chain_id, ""),
            trim_prefix=True,
        )
    ) - {ANNOTATION_RESULTS_METAFILE_NAME, RESULTING_ANNOTATIONS_FILE}

    for file_descriptor in files:
        if file_descriptor.filename in existing_storage_files:
            continue

        storage_client.create_file(
            compose_results_bucket_filename(
                escrow_address,
                chain_id,
                file_descriptor.filename,
            ),
            file_descriptor.file.read(),
        )
