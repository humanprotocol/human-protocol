import logging

from sqlalchemy.orm import Session

import src.cvat.api_calls as cvat_api
import src.models.cvat as cvat_models
import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src import db
from src.core.config import CronConfig
from src.core.oracle_events import ExchangeOracleEvent_JobCreationFailed
from src.core.types import JobStatuses, OracleWebhookTypes, ProjectStatuses
from src.crons._cron_job import cron_job
from src.db import SessionLocal
from src.db import errors as db_errors
from src.db.utils import ForUpdateParams
from src.handlers.completed_escrows import handle_escrows_validations
from src.log import format_sequence


@cron_job
def track_completed_projects(logger: logging.Logger, session: Session) -> None:
    updated_project_cvat_ids = cvat_service.complete_projects_with_completed_tasks(session)

    if updated_project_cvat_ids:
        session.commit()
        logger.info(f"Found new completed projects: {format_sequence(updated_project_cvat_ids)}")


@cron_job
def track_completed_tasks(logger: logging.Logger, session: Session) -> None:
    updated_tasks = cvat_service.complete_tasks_with_completed_jobs(session)

    if updated_tasks:
        cvat_service.touch(
            session,
            cvat_models.Task,
            [t.id for t in updated_tasks],
        )
        session.commit()
        logger.info(
            f"Found new completed tasks: {format_sequence([t.cvat_id for t in updated_tasks])}"
        )


@cron_job
def track_assignments(logger: logging.Logger) -> None:
    """
    Tracks assignments:
    1. Checks time for each active assignment
    2. If an assignment is timed out, expires it
    3. If a project or task state is not "annotation", cancels assignments
    """
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

        cvat_service.touch(session, cvat_models.Job, [a.job.id for a in assignments])

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

        cvat_service.touch(session, cvat_models.Job, [a.job.id for a in assignments])


@cron_job
def track_completed_escrows(logger: logging.Logger, session: Session) -> None:
    awaiting_validations = cvat_service.create_escrow_validations(session)
    if awaiting_validations:
        session.commit()
        logger.info(
            f"Got {len(awaiting_validations)} escrows "
            f"awaiting validation: {format_sequence(awaiting_validations)}"
        )


@cron_job
def track_escrow_validations(logger: logging.Logger) -> None:
    handle_escrows_validations(logger)


@cron_job
def track_task_creation(logger: logging.Logger, session: Session) -> None:
    """
    Checks task creation status to report failed tasks and continue task creation process.
    """

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

    completed: list[cvat_models.DataUpload] = []
    failed: list[cvat_models.DataUpload] = []
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
                event=ExchangeOracleEvent_JobCreationFailed(reason=reason),
            )
        elif status == cvat_api.UploadStatus.FINISHED:
            try:
                cvat_jobs = cvat_api.fetch_task_jobs(upload.task_id)

                existing_jobs = cvat_service.get_jobs_by_cvat_task_id(session, upload.task_id)
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
                        start_frame=cvat_job.start_frame,
                        stop_frame=cvat_job.stop_frame,
                    )

                completed.append(upload)
            except cvat_api.exceptions.ApiException as e:
                failed.append(upload)

                oracle_db_service.outbox.create_webhook(
                    session,
                    escrow_address=project.escrow_address,
                    chain_id=project.chain_id,
                    type=OracleWebhookTypes.job_launcher,
                    event=ExchangeOracleEvent_JobCreationFailed(reason=str(e)),
                )

    if completed:
        cvat_service.touch(session, cvat_models.Task, [upload.task.id for upload in completed])

    if completed or failed:
        cvat_service.finish_data_uploads(session, failed + completed)

        logger.info(
            "Updated creation status of CVAT tasks: {}".format(
                "; ".join(
                    f"{k}: {v}"
                    for k, v in {
                        "success": format_sequence([u.task_id for u in completed]),
                        "failed": format_sequence([u.task_id for u in failed]),
                    }.items()
                    if v
                )
            )
        )


@cron_job
def track_escrow_creation(logger: logging.Logger, session: Session) -> None:
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

    finished: list[cvat_models.EscrowCreation] = []
    for creation in creations:
        created_jobs_count = cvat_service.count_jobs_by_escrow_address(
            session,
            escrow_address=creation.escrow_address,
            chain_id=creation.chain_id,
            status=JobStatuses.new,
        )

        if created_jobs_count != creation.total_jobs:
            continue

        with session.begin_nested(), db.suppress(db_errors.LockNotAvailable):
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
                format_sequence([c.escrow_address for c in finished])
            )
        )
