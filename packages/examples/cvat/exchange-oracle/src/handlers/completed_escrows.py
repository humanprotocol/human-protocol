import io
import logging
from collections.abc import Callable, Sequence
from functools import partial
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
from src.core.oracle_events import (
    ExchangeOracleEvent_EscrowRecorded,
    ExchangeOracleEvent_JobFinished,
)
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

    escrow_creation = cvat_service.get_escrow_creation_by_escrow_address(
        session,
        escrow_address,
        chain_id,
        active=False,
    )
    if not escrow_creation:
        raise AssertionError(f"Can't find escrow creation for escrow '{escrow_address}'")

    jobs = cvat_service.get_jobs_by_escrow_address(session, escrow_address, chain_id)
    if len(jobs) != escrow_creation.total_jobs:
        raise AssertionError(
            f"Unexpected number of jobs fetched for escrow "
            f"'{escrow_address}': {len(jobs)}, expected {escrow_creation.total_jobs}"
        )

    logger.debug(f"Downloading results for the escrow ({escrow_address=})")

    annotation_format = CVAT_EXPORT_FORMAT_MAPPING[manifest.annotation.type]
    # FUTURE-TODO: probably can be removed in the future since
    # these annotations are no longer used in Recording Oracle
    job_annotations = _download_job_annotations(logger, annotation_format, jobs)

    if manifest.annotation.type == TaskTypes.image_skeletons_from_boxes.value:
        # we'll have to merge annotations ourselves for skeletons
        # might want to make this the only behavior in the future
        project_annotations_file = None
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
    logger.debug(f"Uploading annotations for the escrow ({escrow_address=})")

    _upload_escrow_results(
        files=(
            resulting_annotations_file_desc,
            *job_annotations.values(),
            prepare_annotation_metafile(jobs=jobs),
        ),
        chain_id=chain_id,
        escrow_address=escrow_address,
    )

    oracle_db_service.outbox.create_webhook(
        session,
        escrow_address=escrow_address,
        chain_id=chain_id,
        type=OracleWebhookTypes.recording_oracle,
        event=ExchangeOracleEvent_EscrowRecorded(),
    )

    logger.info(
        f"The escrow ({escrow_address=}) is completed, "
        f"resulting annotations are processed successfully"
    )


def _request_escrow_validation(
    logger: logging.Logger,
    chain_id: int,
    escrow_address: str,
    escrow_projects: Sequence[Project],
    session: Session,
) -> None:
    # TODO: lock escrow once there is such a DB object
    assert escrow_projects  # unused, but must hold a lock

    # TODO: maybe upload only current iteration jobs
    jobs = cvat_service.get_jobs_by_escrow_address(session, escrow_address, chain_id)

    logger.debug(f"Uploading assignment info for the escrow ({escrow_address=})")

    _upload_escrow_results(
        files=[prepare_annotation_metafile(jobs=jobs)],
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

    logger.info(f"The escrow ({escrow_address=}) annotation is finished, " f"requesting validation")


def _upload_escrow_results(
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


def _download_project_annotations(
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

    return _download_with_retries(
        logger,
        download_callback=_download_export,
        retry_callback=partial(_request_export, project_cvat_id),
    )


def _download_job_annotations(
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

            job_annotations_file = _download_with_retries(
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
    _request_escrow_validation(logger, chain_id, escrow_address, escrow_projects, session)


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


def handle_escrow_export(
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
