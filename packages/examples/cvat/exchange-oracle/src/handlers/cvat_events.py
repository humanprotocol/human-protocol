from typing import Any

from dateutil.parser import parse as parse_aware_datetime
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import src.cvat.api_calls as cvat_api
import src.models.cvat as cvat_models
import src.services.cvat as cvat_service
from src.core.types import AssignmentStatuses, JobStatuses, ProjectStatuses
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.log import ROOT_LOGGER_NAME
from src.schemas.cvat import CvatWebhook
from src.utils.logging import get_function_logger

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.handler"


def handle_update_job_event(payload: dict[str, Any], session: Session) -> None:
    logger = get_function_logger(module_logger_name)

    if "state" not in payload.get("before_update", {}):
        return

    new_cvat_status = cvat_api.JobStatus(payload["job"]["state"])

    job_id = payload["job"]["id"]
    jobs = cvat_service.get_jobs_by_cvat_id(session, [job_id], for_update=True)
    if not jobs:
        logger.warning(f"Received a job update webhook for an unknown job id {job_id}, ignoring")
        return

    job = jobs[0]

    if job.status != JobStatuses.in_progress:
        logger.warning(
            f"Received a job update webhook for a job id {job_id} "
            f"in the status {job.status}, ignoring"
        )
        return

    if job.project.status != ProjectStatuses.annotation:
        logger.warning(
            f"Received a job update webhook for a job id {job_id} "
            f"with the project in status {job.project.status}, ignoring"
        )
        return

    # ignore updates for any assignments except the last one
    latest_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
        session, job_id, for_update=ForUpdateParams(nowait=True)
    )
    if not latest_assignment:
        logger.warning(
            f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
            "No assignments for this job, ignoring the update"
        )
        return

    webhook_time = parse_aware_datetime(payload["job"]["updated_date"])
    webhook_assignee_id = (payload["job"]["assignee"] or {}).get("id")

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
    elif matching_assignment.status != AssignmentStatuses.created:
        logger.info(
            f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
            "Assignment is already finished, ignoring the update"
        )
    elif (
        new_cvat_status == cvat_api.JobStatus.completed
        and matching_assignment.id == latest_assignment.id
    ):
        # Check that the webhook was issued before the assignment expiration
        if webhook_time < matching_assignment.expires_at:
            logger.info(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "Completing the assignment"
            )
            cvat_service.complete_assignment(
                session, matching_assignment.id, completed_at=webhook_time
            )
            cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)
            cvat_service.update_job_status(session, job.id, status=JobStatuses.completed)
        else:
            logger.warning(
                f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
                "Assignment is expired, rejecting the update"
            )
            cvat_service.expire_assignment(session, matching_assignment.id)
            cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)
            cvat_service.update_job_status(session, job.id, status=JobStatuses.new)

        cvat_service.touch(session, cvat_models.Job, [job.id])
    else:
        logger.info(
            f"Received job #{job.cvat_id} status update: {new_cvat_status.value}. "
            "Ignoring the update"
        )


def cvat_webhook_handler(cvat_webhook: cvat_models.CvatWebhook, session: Session) -> None:
    match cvat_webhook.event_type:
        case cvat_api.WebhookEventType.update_job.value:
            handle_update_job_event(cvat_webhook.event_data, session)


def handle_update_job_event_request(payload: CvatWebhook) -> None:
    if payload.job.get("type") != "annotation":
        # We're not interested in any other job types so far
        return

    if "state" not in (payload.before_update or {}):
        # We're only interested in state updates
        return

    try:
        with SessionLocal.begin() as session:
            cvat_service.incoming_webhooks.create_webhook(
                session,
                cvat_project_id=payload.job["project_id"],  # all oracle jobs have project
                cvat_task_id=payload.job["task_id"],
                cvat_job_id=payload.job["id"],
                event_type=payload.event,
                event_data=payload.model_dump(),
            )
    except IntegrityError as e:
        if "is not present in table" in str(e.orig):
            logger = get_function_logger(module_logger_name)
            logger.warning(
                f"Received a webhook event '{payload.event}' for "
                f"project_id={payload.job['project_id']} "
                f"task_id={payload.job['task_id']} "
                f"job_id={payload.job['id']}. "
                "The corresponding object doesn't exist in the DB, ignoring"
            )
        else:
            raise


def cvat_webhook_request_handler(cvat_webhook: CvatWebhook) -> None:
    match cvat_webhook.event:
        case cvat_api.WebhookEventType.update_job.value:
            handle_update_job_event_request(cvat_webhook)
        case cvat_api.WebhookEventType.ping.value:
            pass
