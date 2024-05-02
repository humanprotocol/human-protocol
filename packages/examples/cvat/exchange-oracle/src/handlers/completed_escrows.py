import io
import itertools
import logging
from functools import partial
from typing import Any, Callable, Dict, List, Optional

from datumaro.util import take_by
from sqlalchemy import exc as db_exc
from sqlalchemy.orm import Session

import src.cvat.api_calls as cvat_api
import src.models.cvat as cvat_models
import src.services.cloud as cloud_service
import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src.chain.escrow import get_escrow_manifest, validate_escrow
from src.core.annotation_meta import RESULTING_ANNOTATIONS_FILE
from src.core.config import CronConfig, StorageConfig
from src.core.oracle_events import ExchangeOracleEvent_TaskFinished
from src.core.storage import compose_results_bucket_filename
from src.core.types import OracleWebhookTypes, ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.handlers.job_export import (
    CVAT_EXPORT_FORMAT_MAPPING,
    FileDescriptor,
    postprocess_annotations,
    prepare_annotation_metafile,
)
from src.services.cloud.types import BucketAccessInfo
from src.utils.assignments import parse_manifest
from src.utils.logging import NullLogger


class _CompletedEscrowsHandler:
    """
    Retrieves and stores completed annotations:
    1. Retrieves annotations from jobs with "completed" status
    2. Processes them
    3. Stores annotations in the oracle bucket
    4. Prepares a webhook to recording oracle
    """

    def __init__(self, logger: Optional[logging.Logger]) -> None:
        self.logger = logger or NullLogger()

    def _download_with_retries(
        self,
        download_callback: Callable[[], io.RawIOBase],
        retry_callback: Callable[[], Any],
        *,
        max_attempts: Optional[int] = None,
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
                    self.logger.info(
                        f"Retrying downloading, attempt #{attempt} of {max_attempts}..."
                    )
                    retry_callback()
                else:
                    raise

    def _process_plain_escrows(self):
        logger = self.logger

        plain_task_types = [t for t in TaskTypes if not t == TaskTypes.image_skeletons_from_boxes]
        with SessionLocal.begin() as session:
            completed_projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.completed,
                included_types=plain_task_types,
                limit=CronConfig.track_completed_escrows_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for project in completed_projects:
                # Check if all jobs within the project are completed
                if not cvat_service.is_project_completed(session, project.id):
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.annotation
                    )
                    continue

                try:
                    # TODO: such escrows can fill all the queried completed projects
                    # need to improve handling for such projects
                    # (e.g. cancel depending on the escrow status)
                    validate_escrow(project.chain_id, project.escrow_address)
                except Exception as e:
                    logger.error(
                        "Failed to handle completed project id {} for escrow {}: {}".format(
                            project.cvat_id, project.escrow_address, e
                        )
                    )
                    continue

                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

                logger.debug(
                    f"Downloading results for the project (escrow_address={project.escrow_address})"
                )

                jobs = cvat_service.get_jobs_by_cvat_project_id(session, project.cvat_id)

                annotation_format = CVAT_EXPORT_FORMAT_MAPPING[project.job_type]
                job_annotations: Dict[int, FileDescriptor] = {}

                for jobs_batch in take_by(
                    jobs, count=CronConfig.track_completed_escrows_jobs_downloading_batch_size
                ):
                    # Request jobs before downloading for faster batch downloading
                    for job in jobs_batch:
                        cvat_api.request_job_annotations(job.cvat_id, format_name=annotation_format)

                    # Collect raw annotations from CVAT, validate and convert them
                    # into a recording oracle suitable format
                    for job in jobs_batch:
                        job_annotations_file = self._download_with_retries(
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
                                project.cvat_id,
                                job.cvat_task_id,
                                job.cvat_id,
                                job_assignment.user.cvat_id,
                                job_assignment.id,
                            ),
                            file=job_annotations_file,
                        )

                # Request project annotations after jobs downloading
                # to avoid occasional export cleanups in CVAT
                cvat_api.request_project_annotations(project.cvat_id, format_name=annotation_format)
                project_annotations_file = self._download_with_retries(
                    download_callback=partial(
                        cvat_api.get_project_annotations,
                        project.cvat_id,
                        format_name=annotation_format,
                    ),
                    retry_callback=partial(
                        cvat_api.request_project_annotations,
                        project.cvat_id,
                        format_name=annotation_format,
                    ),
                )
                project_annotations_file_desc = FileDescriptor(
                    filename=RESULTING_ANNOTATIONS_FILE,
                    file=project_annotations_file,
                )

                annotation_files: List[FileDescriptor] = []
                annotation_files.append(project_annotations_file_desc)

                annotation_metafile = prepare_annotation_metafile(
                    jobs=jobs, job_annotations=job_annotations
                )
                annotation_files.extend(job_annotations.values())
                postprocess_annotations(
                    escrow_address=project.escrow_address,
                    chain_id=project.chain_id,
                    annotations=annotation_files,
                    merged_annotation=project_annotations_file_desc,
                    manifest=manifest,
                    project_images=cvat_service.get_project_images(session, project.cvat_id),
                )

                annotation_files.append(annotation_metafile)

                storage_info = BucketAccessInfo.parse_obj(StorageConfig)
                storage_client = cloud_service.make_client(storage_info)
                existing_storage_files = set(
                    storage_client.list_files(
                        prefix=compose_results_bucket_filename(
                            project.escrow_address,
                            project.chain_id,
                            "",
                        ),
                    )
                )
                for file_descriptor in annotation_files:
                    if file_descriptor.filename in existing_storage_files:
                        continue

                    storage_client.create_file(
                        compose_results_bucket_filename(
                            project.escrow_address,
                            project.chain_id,
                            file_descriptor.filename,
                        ),
                        file_descriptor.file.read(),
                    )

                self._notify_escrow_completed(
                    project.escrow_address, project.chain_id, db_session=session
                )

                cvat_service.update_project_status(session, project.id, ProjectStatuses.validation)

                logger.info(
                    f"The project (escrow_address={project.escrow_address}) "
                    "is completed, resulting annotations are processed successfully"
                )

    def _notify_escrow_completed(self, escrow_address: str, chain_id: int, *, db_session: Session):
        oracle_db_service.outbox.create_webhook(
            db_session,
            escrow_address,
            chain_id,
            OracleWebhookTypes.recording_oracle,
            event=ExchangeOracleEvent_TaskFinished(),
        )

    def _process_skeletons_from_boxes_escrows(self):
        logger = self.logger

        # Here we can have several projects per escrow, so the handling is done in project groups
        with SessionLocal.begin() as session:
            completed_projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.completed,
                included_types=[TaskTypes.image_skeletons_from_boxes],
                limit=CronConfig.track_completed_escrows_chunk_size,
            )

            escrows_with_completed_projects = set()
            for completed_project in completed_projects:
                # Check if all jobs within the project are completed
                if not cvat_service.is_project_completed(session, completed_project.id):
                    cvat_service.update_project_status(
                        session, completed_project.id, ProjectStatuses.annotation
                    )
                    continue

                try:
                    # TODO: such escrows can fill all the queried completed projects
                    # need to improve handling for such projects
                    # (e.g. cancel depending on the escrow status)
                    validate_escrow(completed_project.chain_id, completed_project.escrow_address)
                except Exception as e:
                    logger.error(
                        "Failed to handle completed projects for escrow {}: {}".format(
                            escrow_address, e
                        )
                    )
                    continue

                escrows_with_completed_projects.add(
                    (completed_project.escrow_address, completed_project.chain_id)
                )

            for escrow_address, chain_id in escrows_with_completed_projects:
                # TODO: should throw a db lock exception if lock is not available
                # need to skip the escrow in this case.
                # Maybe there is a better way that utilizes skip_locked
                try:
                    escrow_projects = cvat_service.get_projects_by_escrow_address(
                        session, escrow_address, limit=None, for_update=ForUpdateParams(nowait=True)
                    )
                except db_exc.OperationalError as ex:
                    if "could not obtain lock on row" in str(ex):
                        continue
                    raise

                completed_escrow_projects = [
                    p
                    for p in escrow_projects
                    if p.status
                    in [
                        ProjectStatuses.completed,
                        ProjectStatuses.validation,  # TODO: think about this list
                    ]
                ]
                if len(escrow_projects) != len(completed_escrow_projects):
                    continue

                manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

                logger.debug(
                    f"Downloading results for the escrow (escrow_address={escrow_address})"
                )

                jobs: List[cvat_models.Job] = list(
                    itertools.chain.from_iterable(
                        cvat_service.get_jobs_by_cvat_project_id(session, p.cvat_id)
                        for p in escrow_projects
                    )
                )

                annotation_format = CVAT_EXPORT_FORMAT_MAPPING[manifest.annotation.type]
                job_annotations: Dict[int, FileDescriptor] = {}

                # Collect raw annotations from CVAT, validate and convert them
                # into a recording oracle suitable format
                for jobs_batch in take_by(
                    jobs, count=CronConfig.track_completed_escrows_jobs_downloading_batch_size
                ):
                    # Request jobs before downloading for faster batch downloading
                    for job in jobs_batch:
                        cvat_api.request_job_annotations(job.cvat_id, format_name=annotation_format)

                    for job in jobs_batch:
                        job_annotations_file = self._download_with_retries(
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

                resulting_annotations_file_desc = FileDescriptor(
                    filename=RESULTING_ANNOTATIONS_FILE,
                    file=None,
                )

                annotation_files: List[FileDescriptor] = []
                annotation_files.append(resulting_annotations_file_desc)

                annotation_metafile = prepare_annotation_metafile(
                    jobs=jobs, job_annotations=job_annotations
                )
                annotation_files.extend(job_annotations.values())
                postprocess_annotations(
                    escrow_address=escrow_address,
                    chain_id=chain_id,
                    annotations=annotation_files,
                    merged_annotation=resulting_annotations_file_desc,
                    manifest=manifest,
                    project_images=None,
                )

                annotation_files.append(annotation_metafile)

                storage_info = BucketAccessInfo.parse_obj(StorageConfig)
                storage_client = cloud_service.make_client(storage_info)
                existing_storage_files = set(
                    storage_client.list_files(
                        prefix=compose_results_bucket_filename(
                            escrow_address,
                            chain_id,
                            "",
                        ),
                    )
                )
                for file_descriptor in annotation_files:
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

                self._notify_escrow_completed(escrow_address, chain_id, db_session=session)

                for project in escrow_projects:
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.validation
                    )

                logger.info(
                    f"The escrow (escrow_address={project.escrow_address}) "
                    "is completed, resulting annotations are processed successfully"
                )

    def process(self):
        self._process_plain_escrows()
        self._process_skeletons_from_boxes_escrows()


def handle_completed_escrows(logger: logging.Logger) -> None:
    handler = _CompletedEscrowsHandler(logger=logger)
    handler.process()
