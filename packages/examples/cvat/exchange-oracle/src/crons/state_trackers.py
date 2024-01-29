from typing import Dict, List

import src.cvat.api_calls as cvat_api
import src.models.cvat as cvat_models
import src.services.cloud.utils as cloud_client
import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src.chain.escrow import get_escrow_manifest, validate_escrow
from src.core.annotation_meta import RESULTING_ANNOTATIONS_FILE
from src.core.config import CronConfig, StorageConfig
from src.core.oracle_events import (
    ExchangeOracleEvent_TaskCreationFailed,
    ExchangeOracleEvent_TaskFinished,
)
from src.core.storage import compose_results_bucket_filename
from src.core.types import JobStatuses, OracleWebhookTypes, ProjectStatuses, TaskStatus
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.handlers.job_export import (
    CVAT_EXPORT_FORMAT_MAPPING,
    FileDescriptor,
    postprocess_annotations,
    prepare_annotation_metafile,
)
from src.log import ROOT_LOGGER_NAME
from src.utils.assignments import parse_manifest
from src.utils.logging import get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"


def track_completed_projects() -> None:
    """
    Tracks completed projects:
    1. Retrieves projects with "annotation" status
    2. Retrieves tasks related to this project
    3. If all tasks are completed -> updates project status to "completed"
    """
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")
        with SessionLocal.begin() as session:
            # Get active projects from db
            projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.annotation,
                limit=CronConfig.track_completed_projects_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            completed_project_ids = []

            for project in projects:
                tasks = cvat_service.get_tasks_by_cvat_project_id(session, project.cvat_id)
                if tasks and all(task.status == TaskStatus.completed for task in tasks):
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.completed
                    )

                    completed_project_ids.append(project.cvat_id)

            if completed_project_ids:
                logger.info(
                    "Found new completed projects: {}".format(
                        ", ".join(str(t) for t in completed_project_ids)
                    )
                )
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")


def track_completed_tasks() -> None:
    """
    Tracks completed tasks:
    1. Retrieves tasks with "annotation" status
    2. Retrieves jobs related to this task
    3. If all jobs are completed -> updates task status to "completed"
    """
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")
        with SessionLocal.begin() as session:
            tasks = cvat_service.get_tasks_by_status(
                session, TaskStatus.annotation, for_update=ForUpdateParams(skip_locked=True)
            )

            completed_task_ids = []

            for task in tasks:
                jobs = cvat_service.get_jobs_by_cvat_task_id(session, task.cvat_id)
                if jobs and all(job.status == JobStatuses.completed for job in jobs):
                    cvat_service.update_task_status(session, task.id, TaskStatus.completed)

                    completed_task_ids.append(task.cvat_id)

            if completed_task_ids:
                logger.info(
                    "Found new completed tasks: {}".format(
                        ", ".join(str(t) for t in completed_task_ids)
                    )
                )
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")


def track_assignments() -> None:
    """
    Tracks assignments:
    1. Checks time for each active assignment
    2. If an assignment is timed out, expires it
    3. If a project or task state is not "annotation", cancels assignments
    """
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            assignments = cvat_service.get_unprocessed_expired_assignments(
                session,
                limit=CronConfig.track_assignments_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for assignment in assignments:
                logger.info(
                    "Expiring the unfinished assignment {} (user {}, job id {})".format(
                        assignment.id,
                        assignment.user_wallet_address,
                        assignment.cvat_job_id,
                    )
                )

                latest_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
                    session, assignment.cvat_job_id
                )
                if latest_assignment.id == assignment.id:
                    # Avoid un-assigning if it's not the latest assignment

                    cvat_api.update_job_assignee(
                        assignment.cvat_job_id, assignee_id=None
                    )  # note that calling it in a loop can take too much time

                cvat_service.expire_assignment(session, assignment.id)

        with SessionLocal.begin() as session:
            assignments = cvat_service.get_active_assignments(
                session,
                limit=CronConfig.track_assignments_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for assignment in assignments:
                if assignment.job.project.status != ProjectStatuses.annotation:
                    logger.warning(
                        "Canceling the unfinished assignment {} (user {}, job id {}) - "
                        "the project state is not annotation".format(
                            assignment.id,
                            assignment.user_wallet_address,
                            assignment.cvat_job_id,
                        )
                    )

                    latest_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
                        session, assignment.cvat_job_id
                    )
                    if latest_assignment.id == assignment.id:
                        # Avoid un-assigning if it's not the latest assignment

                        cvat_api.update_job_assignee(
                            assignment.cvat_job_id, assignee_id=None
                        )  # note that calling it in a loop can take too much time

                    cvat_service.cancel_assignment(session, assignment.id)
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")


def retrieve_annotations() -> None:
    """
    Retrieves and stores completed annotations:
    1. Retrieves annotations from projects with "completed" status
    2. Postprocesses them
    3. Stores annotations in s3 bucket
    4. Prepares a webhook to recording oracle
    """
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")
        with SessionLocal.begin() as session:
            # Get completed projects from db
            projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.completed,
                limit=CronConfig.retrieve_annotations_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for project in projects:
                # Check if all jobs within the project are completed
                if not cvat_service.is_project_completed(session, project.id):
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.annotation
                    )
                    continue

                validate_escrow(project.chain_id, project.escrow_address)

                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

                logger.debug(
                    f"Downloading results for the project (escrow_address={project.escrow_address})"
                )

                jobs = cvat_service.get_jobs_by_cvat_project_id(session, project.cvat_id)

                annotation_format = CVAT_EXPORT_FORMAT_MAPPING[project.job_type]
                job_annotations: Dict[int, FileDescriptor] = {}

                # Request dataset preparation beforehand
                for job in jobs:
                    cvat_api.request_job_annotations(job.cvat_id, format_name=annotation_format)
                cvat_api.request_project_annotations(project.cvat_id, format_name=annotation_format)

                # Collect raw annotations from CVAT, validate and convert them
                # into a recording oracle suitable format
                for job in jobs:
                    job_annotations_file = cvat_api.get_job_annotations(
                        job.cvat_id, format_name=annotation_format
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

                project_annotations_file = cvat_api.get_project_annotations(
                    project.cvat_id, format_name=annotation_format
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

                storage_client = cloud_client.S3Client(
                    StorageConfig.provider_endpoint_url(),
                    access_key=StorageConfig.access_key,
                    secret_key=StorageConfig.secret_key,
                )
                existing_storage_files = set(
                    f.key
                    for f in storage_client.list_files(
                        StorageConfig.data_bucket_name,
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
                        StorageConfig.data_bucket_name,
                        compose_results_bucket_filename(
                            project.escrow_address,
                            project.chain_id,
                            file_descriptor.filename,
                        ),
                        file_descriptor.file.read(),
                    )

                oracle_db_service.outbox.create_webhook(
                    session,
                    project.escrow_address,
                    project.chain_id,
                    OracleWebhookTypes.recording_oracle,
                    event=ExchangeOracleEvent_TaskFinished(),
                )

                cvat_service.update_project_status(session, project.id, ProjectStatuses.validation)

                logger.info(
                    f"The project (escrow_address={project.escrow_address}) "
                    "is finished, resulting annotations are processed successfully"
                )
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")


def track_task_creation() -> None:
    """
    Checks task creation status to report failed tasks and continue task creation process.
    """

    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            # TODO: maybe add load balancing (e.g. round-robin queue, shuffling)
            # to avoid blocking new tasks
            uploads = cvat_service.get_active_task_uploads(
                session,
                limit=CronConfig.track_creating_tasks_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            logger.debug(
                "Checking the data uploading status of CVAT tasks: {}".format(
                    ", ".join(str(u.task_id) for u in uploads)
                )
            )

            completed: List[cvat_models.DataUpload] = []
            failed: List[cvat_models.DataUpload] = []
            for upload in uploads:
                status, reason = cvat_api.get_task_upload_status(upload.task_id)
                if not status or status == cvat_api.UploadStatus.FAILED:
                    failed.append(upload)

                    project = upload.task.project

                    oracle_db_service.outbox.create_webhook(
                        session,
                        escrow_address=project.escrow_address,
                        chain_id=project.chain_id,
                        type=OracleWebhookTypes.job_launcher,
                        event=ExchangeOracleEvent_TaskCreationFailed(reason=reason),
                    )
                elif status == cvat_api.UploadStatus.FINISHED:
                    try:
                        cvat_jobs = cvat_api.fetch_task_jobs(upload.task_id)

                        existing_jobs = cvat_service.get_jobs_by_cvat_task_id(
                            session, upload.task_id
                        )
                        existing_job_ids = set(j.cvat_id for j in existing_jobs)

                        for cvat_job in cvat_jobs:
                            if cvat_job.id in existing_job_ids:
                                continue

                            cvat_service.create_job(
                                session,
                                cvat_job.id,
                                upload.task_id,
                                upload.task.cvat_project_id,
                                status=JobStatuses(cvat_job.state),
                            )

                        completed.append(upload)
                    except cvat_api.exceptions.ApiException as e:
                        failed.append(upload)

                        oracle_db_service.outbox.create_webhook(
                            session,
                            escrow_address=project.escrow_address,
                            chain_id=project.chain_id,
                            type=OracleWebhookTypes.job_launcher,
                            event=ExchangeOracleEvent_TaskCreationFailed(reason=str(e)),
                        )

            cvat_service.finish_uploads(session, failed + completed)

            if completed or failed:
                logger.info(
                    "Updated creation status of CVAT tasks: {}".format(
                        "; ".join(
                            f"{k}: {v}"
                            for k, v in {
                                "success": ", ".join(str(u.task_id) for u in completed),
                                "failed": ", ".join(str(u.task_id) for u in failed),
                            }.items()
                            if v
                        )
                    )
                )
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")
