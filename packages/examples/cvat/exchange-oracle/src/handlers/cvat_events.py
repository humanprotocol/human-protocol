from dateutil.parser import parse as parse_aware_datetime

import src.cvat.api_calls as cvat_api
import src.models.cvat as models
import src.services.cvat as cvat_service
from src import db
from src.core.types import AssignmentStatuses, JobStatuses, ProjectStatuses
from src.db import SessionLocal
from src.db import errors as db_errors
from src.log import ROOT_LOGGER_NAME
from src.schemas.cvat import CvatWebhook
from src.utils.logging import get_function_logger

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.handler"


def handle_update_job_event(payload: dict) -> None:
    logger = get_function_logger(module_logger_name)

    if "state" not in payload.before_update:
        return

    new_cvat_status = cvat_api.JobStatus(payload.job["state"])

    with SessionLocal.begin() as session:
        job_id = payload.job["id"]
        jobs = cvat_service.get_jobs_by_cvat_id(session, [job_id], for_update=True)
        if not jobs:
            logger.warning(
                f"Received a job update webhook for an unknown job id {job_id}, ignoring "
            )
            return

        job = jobs[0]

        if job.status != JobStatuses.in_progress:
            logger.warning(
                f"Received a job update webhook for a job id {job_id} "
                f"in the status {job.status}, ignoring "
            )
            return

        # ignore updates for any assignments except the last one
        latest_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
            session, job_id, for_update=True
        )
        if not latest_assignment:
            logger.warning(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "No assignments for this job, ignoring the update"
            )
            return

        webhook_time = parse_aware_datetime(payload.job["updated_date"])
        webhook_assignee_id = (payload.job["assignee"] or {}).get("id")

        matching_assignment = next(
            (
                a
                for a in [latest_assignment]
                if a.user.cvat_id == webhook_assignee_id
                if a.created_at < webhook_time
            ),
            None,
        )

        if not matching_assignment:
            logger.warning(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "No matching assignment or the assignment is too old, ignoring the update"
            )
        elif matching_assignment.is_finished:
            if matching_assignment.status == AssignmentStatuses.created:
                logger.warning(
                    f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                    "Assignment is expired, rejecting the update"
                )
                cvat_service.expire_assignment(session, matching_assignment.id)

                if matching_assignment.id == latest_assignment.id:
                    cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)
                    cvat_service.update_job_status(session, job.id, status=JobStatuses.new)

                cvat_service.touch(session, models.Job, [job.id])
            else:
                logger.info(
                    f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                    "Assignment is already finished, ignoring the update"
                )
        elif (
            new_cvat_status == cvat_api.JobStatus.completed
            and matching_assignment.id == latest_assignment.id
            and matching_assignment.is_finished == False
        ):
            logger.info(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "Completing the assignment"
            )
            cvat_service.complete_assignment(
                session, matching_assignment.id, completed_at=webhook_time
            )
            cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)
            cvat_service.update_job_status(session, job.id, status=JobStatuses.completed)
            cvat_service.touch(session, models.Job, [job.id])
        else:
            logger.info(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "Ignoring the update"
            )


def handle_create_job_event(payload: dict) -> None:
    logger = get_function_logger(module_logger_name)

    with SessionLocal.begin() as session:
        if payload.job["type"] != "annotation":
            return

        task_id = payload.job["task_id"]
        if not cvat_service.get_tasks_by_cvat_id(session, [task_id], for_update=True):
            logger.warning(
                f"Received a job creation webhook for an unknown task id {task_id}, ignoring "
            )
            return

        jobs = cvat_service.get_jobs_by_cvat_id(session, [payload.job["id"]])

        if not jobs:
            job_id = cvat_service.create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
                payload.job["project_id"],
                status=JobStatuses[payload.job["state"]],
                start_frame=payload.job["start_frame"],
                stop_frame=payload.job["stop_frame"],
            )
            cvat_service.touch(session, models.Job, [job_id])

        escrow_creation = None
        with db.suppress(db_errors.LockNotAvailable):
            projects = cvat_service.get_projects_by_cvat_ids(
                session, project_cvat_ids=[payload.job["project_id"]], for_update=True
            )
            if not projects:
                return

            project = projects[0]

            escrow_creation = cvat_service.get_escrow_creation_by_escrow_address(
                session,
                escrow_address=project.escrow_address,
                chain_id=project.chain_id,
                active=True,
                for_update=True,
            )

        if not escrow_creation:
            return

        created_jobs_count = cvat_service.count_jobs_by_escrow_address(
            session,
            escrow_address=escrow_creation.escrow_address,
            chain_id=escrow_creation.chain_id,
            status=JobStatuses.new,
        )

        if created_jobs_count != escrow_creation.total_jobs:
            return

        cvat_service.update_project_statuses_by_escrow_address(
            session=session,
            escrow_address=escrow_creation.escrow_address,
            chain_id=escrow_creation.chain_id,
            status=ProjectStatuses.annotation,
        )


def cvat_webhook_handler(cvat_webhook: CvatWebhook) -> None:
    match cvat_webhook.event:
        case cvat_api.WebhookEventType.update_job.value:
            handle_update_job_event(cvat_webhook)
        case cvat_api.WebhookEventType.create_job.value:
            handle_create_job_event(cvat_webhook)
        case cvat_api.WebhookEventType.ping.value:
            pass
