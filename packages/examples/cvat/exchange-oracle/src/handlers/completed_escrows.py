import csv
import io
import json
import logging
import os
import zipfile
from collections.abc import Callable, Sequence
from functools import partial
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from datumaro.util import take_by
from sqlalchemy.orm import Session

import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src.chain.escrow import get_escrow_manifest, validate_escrow
from src.core.annotation_meta import ANNOTATION_RESULTS_METAFILE_NAME, RESULTING_ANNOTATIONS_FILE
from src.core.config import CronConfig, StorageConfig
from src.core.oracle_events import ExchangeOracleEvent_JobFinished
from src.core.storage import compose_results_bucket_filename
from src.core.types import EscrowValidationStatuses, OracleWebhookTypes, TaskTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.handlers.job_export import (
    CVAT_EXPORT_FORMAT_MAPPING,
    FileDescriptor,
    postprocess_annotations,
    prepare_annotation_metafile,
)
from src.models.cvat import Job, Project
from src.services.cloud.types import BucketAccessInfo
from src.utils.assignments import parse_manifest
from src.utils.zip_archive import write_dir_to_zip_archive


def _download_with_retries(
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


def _export_escrow_annotations(
    logger: logging.Logger,
    chain_id: int,
    escrow_address: str,
    escrow_projects: Sequence[Project],
    session: Session,
) -> None:
    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    logger.debug(f"Downloading results for the escrow ({escrow_address=})")

    jobs = cvat_service.get_jobs_by_escrow_address(session, escrow_address, chain_id)

    annotation_format = CVAT_EXPORT_FORMAT_MAPPING[manifest.annotation.type]
    # FUTURE-TODO: probably can be removed in the future since
    # these annotations are no longer used in Recording Oracle
    job_annotations = _download_job_annotations(logger, annotation_format, jobs)

    if manifest.annotation.type == TaskTypes.image_skeletons_from_boxes.value:
        # we'll have to merge annotations ourselves for skeletons
        # might want to make this the only behaviour in the future
        project_annotations_file = None
        project_images = None
    elif manifest.annotation.type == TaskTypes.audio_transcription:
        project_annotations_file = _make_project_annotation(job_annotations)
        project_images = None
    else:
        # escrows with simple task types must have only one project
        try:
            (project,) = escrow_projects
        except ValueError:
            raise NotImplementedError(
                f"{manifest.annotation.type} is expected to have exactly one project,"
                f" not {len(escrow_projects)}"
            )
        project_annotations_file = _download_project_annotations(
            logger,
            annotation_format,
            project.cvat_id,
        )
        project_images = cvat_service.get_project_images(session, project.cvat_id)

    resulting_annotations_file_desc = FileDescriptor(
        filename=RESULTING_ANNOTATIONS_FILE,
        file=project_annotations_file,
    )

    logger.debug(f"Postprocessing results for the escrow ({escrow_address=})")

    postprocess_annotations(
        escrow_address=escrow_address,
        chain_id=chain_id,
        annotations=(
            resulting_annotations_file_desc,
            *job_annotations.values(),
        ),
        merged_annotation=resulting_annotations_file_desc,
        manifest=manifest,
        project_images=project_images,
    )
    logger.debug(f"Uploading results for the escrow ({escrow_address=})")

    _upload_annotations(
        annotation_files=(
            resulting_annotations_file_desc,
            *job_annotations.values(),
            prepare_annotation_metafile(jobs=jobs, job_annotations=job_annotations),
        ),
        chain_id=chain_id,
        escrow_address=escrow_address,
    )

    oracle_db_service.outbox.create_webhook(
        session,
        escrow_address=escrow_address,
        chain_id=chain_id,
        type=OracleWebhookTypes.recording_oracle,
        event=ExchangeOracleEvent_JobFinished(),
    )

    logger.info(
        f"The escrow ({escrow_address=}) is completed, "
        f"resulting annotations are processed successfully"
    )


def _upload_annotations(
    annotation_files: Sequence[FileDescriptor], chain_id: int, escrow_address: str
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
    for file_descriptor in annotation_files:
        if file_descriptor.filename in existing_storage_files:
            continue

        if file_descriptor.file == None:
            continue

        storage_client.create_file(
            compose_results_bucket_filename(
                escrow_address,
                chain_id,
                file_descriptor.filename,
            ),
            file_descriptor.file.read(),
        )


def _download_project_annotations(
    logger: logging.Logger, annotation_format: str, project_cvat_id: int
) -> io.RawIOBase:
    cvat_api.request_project_annotations(project_cvat_id, format_name=annotation_format)
    return _download_with_retries(
        logger,
        download_callback=partial(
            cvat_api.get_project_annotations,
            project_cvat_id,
            format_name=annotation_format,
        ),
        retry_callback=partial(
            cvat_api.request_project_annotations,
            project_cvat_id,
            format_name=annotation_format,
        ),
    )


def convert_value(value: str):
    """Converts a string value to int, float, or keeps it as string."""
    try:
        f = float(value)
        if f.is_integer():
            return int(f)
        return f
    except ValueError:
        return value


def _make_project_annotation(job_annotations: dict[int, FileDescriptor]):
    annotations = []

    with TemporaryDirectory() as tempdir:
        temp_path = Path(tempdir)

        merged_annotations_path = temp_path / "merged_annotations"
        merged_annotations_path.mkdir(parents=True, exist_ok=True)

        clips_path = merged_annotations_path / "clips"
        clips_path.mkdir(parents=True, exist_ok=True)

        annotations_file = merged_annotations_path / "annotations.json"

        for downloaded_annotations in job_annotations.values():
            with zipfile.ZipFile(io.BytesIO(downloaded_annotations.file.getvalue())) as zip_file:
                clip_files = [f for f in zip_file.namelist() if f.startswith("clips/")]

                for clip_file in clip_files:
                    with zip_file.open(clip_file) as audio_file:
                        clip_name = os.path.basename(clip_file)
                        if clip_name:
                            with (clips_path / clip_name).open("wb") as f:
                                f.write(audio_file.read())

                if "data.tsv" in zip_file.namelist():
                    with zip_file.open("data.tsv") as tsv_file:
                        reader = csv.DictReader(
                            io.StringIO(tsv_file.read().decode("utf-8")), delimiter="\t"
                        )
                        entries = [
                            {key: convert_value(value) for key, value in row.items()}
                            for row in reader
                        ]

                        annotations.extend(entries)

        with annotations_file.open("w") as f:
            json.dump(annotations, f, indent=4)

        merged_annotations_archive = io.BytesIO()
        write_dir_to_zip_archive(merged_annotations_path, merged_annotations_archive)
        merged_annotations_archive.seek(0)

        return merged_annotations_archive


def _download_job_annotations(
    logger: logging.Logger, annotation_format: str, jobs: Sequence[Job]
) -> dict[int, FileDescriptor]:
    job_annotations: dict[int, FileDescriptor] = {}
    # Collect raw annotations from CVAT, validate and convert them
    # into a recording oracle suitable format
    for jobs_batch in take_by(
        jobs, count=CronConfig.track_completed_escrows_jobs_downloading_batch_size
    ):
        # Request jobs before downloading for faster batch downloading
        for job in jobs_batch:
            cvat_api.request_job_annotations(job.cvat_id, format_name=annotation_format)

        for job in jobs_batch:
            job_annotations_file = _download_with_retries(
                logger,
                download_callback=partial(
                    cvat_api.get_job_annotations,
                    job.cvat_id,
                    format_name=annotation_format,
                ),
                retry_callback=partial(
                    cvat_api.request_job_annotations,
                    job.cvat_id,
                    format_name=annotation_format,
                ),
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


def _handle_escrow_validation(
    logger: logging.Logger,
    session: Session,
    escrow_address: str,
    chain_id: int,
):
    validate_escrow(chain_id, escrow_address)

    escrow_projects = cvat_service.get_projects_by_escrow_address(
        session, escrow_address, limit=None, for_update=ForUpdateParams(nowait=True)
    )
    _export_escrow_annotations(logger, chain_id, escrow_address, escrow_projects, session)


def handle_escrows_validations(logger: logging.Logger) -> None:
    for _ in range(CronConfig.track_escrow_validations_chunk_size):
        with SessionLocal.begin() as session:
            # Need to work in separate transactions for each escrow, as a failing DB call
            # (e.g. a failed lock attempt) will abort the transaction. A nested transaction
            # can also be used for handling this.
            escrow_validation = cvat_service.lock_escrow_for_validation(session)
            if not escrow_validation:
                break

            escrow_address = escrow_validation.escrow_address
            chain_id = escrow_validation.chain_id

            update_kwargs = {}
            try:
                _handle_escrow_validation(logger, session, escrow_address, chain_id)

                # Change status so validation won't be attempted again
                update_kwargs["status"] = EscrowValidationStatuses.in_progress
            except Exception as e:
                logger.exception(e)

            cvat_service.update_escrow_validation(
                session,
                escrow_address=escrow_address,
                chain_id=chain_id,
                increase_attempts=True,  # increase attempts always to allow escrow rotation
                **update_kwargs,
            )
