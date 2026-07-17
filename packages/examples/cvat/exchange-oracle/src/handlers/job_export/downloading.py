"""CVAT annotation downloading for the escrow export flow."""

from __future__ import annotations

from functools import partial
from typing import TYPE_CHECKING

from datumaro.util import take_by

import src.cvat.api_calls as cvat_api
from src.core.config import CronConfig
from src.handlers.job_export.results import FileDescriptor

if TYPE_CHECKING:
    import io
    import logging
    from collections.abc import Callable, Sequence
    from typing import Any

    from src.models.cvat import Job


def download_with_retries(
    logger: logging.Logger,
    download_callback: Callable[[], io.RawIOBase],
    retry_callback: Callable[[], Any],
    *,
    max_attempts: int | None = None,
) -> io.RawIOBase:
    """
    Sometimes CVAT downloading can fail with the 500 error.
    This function tries to repeat the export in such cases.
    """

    if max_attempts is None:
        max_attempts = CronConfig.track_completed_escrows_max_downloading_retries

    attempt = 0
    while attempt < max_attempts:
        try:
            return download_callback()
        except cvat_api.exceptions.ApiException as e:
            if 500 <= e.status < 600 and attempt + 1 < max_attempts:
                attempt += 1
                logger.info(f"Retrying downloading, attempt #{attempt} of {max_attempts}...")
                retry_callback()
            else:
                raise
    return None


def download_project_annotations(
    logger: logging.Logger, annotation_format: str, project_cvat_id: int
) -> io.RawIOBase:
    export_ids = []

    def _request_export(cvat_id: int):
        request_id = cvat_api.request_project_annotations(cvat_id, format_name=annotation_format)
        export_ids.append(request_id)
        return request_id

    def _download_export():
        request_id = export_ids.pop(0)
        return cvat_api.get_project_annotations(request_id=request_id)

    _request_export(project_cvat_id)

    return download_with_retries(
        logger,
        download_callback=_download_export,
        retry_callback=partial(_request_export, project_cvat_id),
    )


def download_job_annotations(
    logger: logging.Logger, annotation_format: str, jobs: Sequence[Job]
) -> dict[int, FileDescriptor]:
    # Collect raw annotations from CVAT, validate and convert them
    # into a recording oracle suitable format
    job_annotations: dict[int, FileDescriptor] = {}

    export_ids: list[tuple[Job, str]] = []

    def _request_export(job: Job):
        request_id = cvat_api.request_job_annotations(job.cvat_id, format_name=annotation_format)
        export_ids.append((job, request_id))
        return request_id

    for jobs_batch in take_by(
        jobs, count=CronConfig.track_completed_escrows_jobs_downloading_batch_size
    ):
        # Request jobs before downloading for faster batch downloading
        for job in jobs_batch:
            _request_export(job)

        while export_ids:
            (job, request_id) = export_ids.pop(0)

            job_annotations_file = download_with_retries(
                logger,
                download_callback=partial(cvat_api.get_job_annotations, request_id=request_id),
                retry_callback=partial(_request_export, job),
            )

            job_assignment = job.latest_assignment
            job_annotations[job.cvat_id] = FileDescriptor(
                filename="project_{}-task_{}-job_{}-user_{}-assignment_{}.zip".format(
                    job.cvat_project_id,
                    job.cvat_task_id,
                    job.cvat_id,
                    job_assignment.user.cvat_id,
                    job_assignment.id,
                ),
                file=job_annotations_file,
            )

    return job_annotations
