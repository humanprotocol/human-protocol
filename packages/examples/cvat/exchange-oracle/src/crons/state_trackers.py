from contextlib import suppress
from typing import List

import src.cvat.api_calls as cvat_api
import src.models.cvat as cvat_models
import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src.core.config import CronConfig
from src.core.oracle_events import ExchangeOracleEvent_TaskCreationFailed
from src.core.types import JobStatuses, OracleWebhookTypes, ProjectStatuses, TaskStatuses
from src.db import SessionLocal
from src.db import errors as db_errors
from src.db.utils import ForUpdateParams
from src.handlers.completed_escrows import handle_completed_escrows
from src.log import ROOT_LOGGER_NAME
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
                if tasks and all(task.status == TaskStatuses.completed for task in tasks):
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
                session, TaskStatuses.annotation, for_update=ForUpdateParams(skip_locked=True)
            )

            completed_task_ids = []

            for task in tasks:
                jobs = cvat_service.get_jobs_by_cvat_task_id(session, task.cvat_id)
                if jobs and all(job.status == JobStatuses.completed for job in jobs):
                    cvat_service.update_task_status(session, task.id, TaskStatuses.completed)

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


def track_completed_escrows() -> None:
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")

        handle_completed_escrows(logger)
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

            if not uploads:
                return

            logger.debug(
                "Checking the data uploading status of CVAT tasks: {}".format(
                    ", ".join(str(u.task_id) for u in uploads)
                )
            )

            completed: List[cvat_models.DataUpload] = []
            failed: List[cvat_models.DataUpload] = []
            for upload in uploads:
                status, reason = cvat_api.get_task_upload_status(upload.task_id)
                project = upload.task.project
                if not status or status == cvat_api.UploadStatus.FAILED:
                    # TODO: add retries if 5xx
                    failed.append(upload)

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

            if completed or failed:
                cvat_service.finish_data_uploads(session, failed + completed)

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


def track_escrow_creation() -> None:
    logger = get_function_logger(module_logger)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            creations = cvat_service.get_active_escrow_creations(
                session,
                limit=CronConfig.track_escrow_creation_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            if not creations:
                return

            logger.debug(
                "Checking escrow creation statuses for escrows: {}".format(
                    ", ".join(str(c.escrow_address) for c in creations)
                )
            )

            finished: List[cvat_models.EscrowCreation] = []
            for creation in creations:
                created_jobs_count = cvat_service.count_jobs_by_escrow_address(
                    session,
                    escrow_address=creation.escrow_address,
                    chain_id=creation.chain_id,
                    status=JobStatuses.new,
                )

                if created_jobs_count != creation.total_jobs:
                    continue

                with suppress(db_errors.LockNotAvailable):
                    cvat_service.update_project_statuses_by_escrow_address(
                        session=session,
                        escrow_address=creation.escrow_address,
                        chain_id=creation.chain_id,
                        status=ProjectStatuses.annotation,
                    )
                    finished.append(creation)

            if finished:
                cvat_service.finish_escrow_creations(session, finished)

                logger.info(
                    "Updated creation status of escrows: {}".format(
                        ", ".join(c.escrow_address for c in finished)
                    )
                )
    except Exception as error:
        logger.exception(error)
    finally:
        logger.debug("Finishing cron job")
