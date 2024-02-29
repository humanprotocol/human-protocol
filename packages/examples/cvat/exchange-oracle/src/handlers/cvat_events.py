from typing import List

from dateutil.parser import parse as parse_aware_datetime

import src.cvat.api_calls as cvat_api
import src.models.cvat as models
import src.services.cvat as cvat_service
from src.core.types import AssignmentStatuses, CvatEventTypes, JobStatuses
from src.db import SessionLocal
from src.log import ROOT_LOGGER_NAME
from src.utils.logging import get_function_logger

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.handler"


def handle_update_job_event(payload: dict) -> None:
    logger = get_function_logger(module_logger_name)

    with SessionLocal.begin() as session:
        job_id = payload.job["id"]
        jobs = cvat_service.get_jobs_by_cvat_id(session, [job_id], for_update=True)
        if not jobs:
            logger.warning(
                f"Received a job update webhook for an unknown job id {job_id}, ignoring "
            )
            return

        job = jobs[0]

        if "state" in payload.before_update:
            job_assignments = job.assignments
            new_status = JobStatuses(payload.job["state"])

            if not job_assignments:
                logger.warning(
                    f"Received job #{job.cvat_id} status update: {new_status.value}. "
                    "No assignments for this job, ignoring the update"
                )
            else:
                webhook_time = parse_aware_datetime(payload.job["updated_date"])
                webhook_assignee_id = (payload.job["assignee"] or {}).get("id")

                job_assignments: List[models.Assignment] = sorted(
                    job_assignments, key=lambda a: a.created_at, reverse=True
                )
                latest_assignment = job.assignments[0]
                matching_assignment = next(
                    (
                        a
                        for a in job_assignments
                        if a.user.cvat_id == webhook_assignee_id
                        if a.created_at < webhook_time
                    ),
                    None,
                )

                if not matching_assignment:
                    logger.warning(
                        f"Received job #{job.cvat_id} status update: {new_status.value}. "
                        "Can't find a matching assignment, ignoring the update"
                    )
                elif matching_assignment.is_finished:
                    if matching_assignment.status == AssignmentStatuses.created:
                        logger.warning(
                            f"Received job #{job.cvat_id} status update: {new_status.value}. "
                            "Assignment is expired, rejecting the update"
                        )
                        cvat_service.expire_assignment(session, matching_assignment.id)

                        if matching_assignment.id == latest_assignment.id:
                            cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)

                    else:
                        logger.info(
                            f"Received job #{job.cvat_id} status update: {new_status.value}. "
                            "Assignment is already finished, ignoring the update"
                        )
                elif (
                    new_status == JobStatuses.completed
                    and matching_assignment.id == latest_assignment.id
                    and matching_assignment.status == AssignmentStatuses.created
                ):
                    logger.info(
                        f"Received job #{job.cvat_id} status update: {new_status.value}. "
                        "Completing the assignment"
                    )
                    cvat_service.complete_assignment(
                        session, matching_assignment.id, completed_at=webhook_time
                    )
                    cvat_service.update_job_status(session, job.id, new_status)

                    cvat_api.update_job_assignee(job.cvat_id, assignee_id=None)

                else:
                    logger.info(
                        f"Received job #{job.cvat_id} status update: {new_status.value}. "
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
            cvat_service.create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
                payload.job["project_id"],
                status=JobStatuses[payload.job["state"]],
            )


def cvat_webhook_handler(cvat_webhook: dict) -> None:
    match cvat_webhook.event:
        case CvatEventTypes.update_job.value:
            handle_update_job_event(cvat_webhook)
        case CvatEventTypes.create_job.value:
            handle_create_job_event(cvat_webhook)
        case CvatEventTypes.ping.value:
            pass
