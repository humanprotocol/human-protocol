from src.db import SessionLocal
from src.core.constants import EventTypes

import src.services.cvat as cvat_service


def handle_update_job_event(payload: dict) -> None:
    with SessionLocal.begin() as session:
        job = cvat_service.get_job_by_cvat_id(session, payload.job["id"])
        if not job:
            cvat_service.create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
                payload.job["project_id"],
                payload.job["assignee"]["username"]
                if payload.job["assignee"] is not None
                else "",
                payload.job["state"],
            )
        else:
            if "assignee" in payload.before_update:
                assignee = (
                    payload.job["assignee"]["username"]
                    if payload.job["assignee"]
                    else ""
                )
                cvat_service.update_job_assignee(session, job.id, assignee)
            if "state" in payload.before_update:
                cvat_service.update_job_status(session, job.id, payload.job["state"])


def handle_create_job_event(payload: dict) -> None:
    with SessionLocal.begin() as session:
        job = cvat_service.get_job_by_cvat_id(session, payload.job["id"])
        if not job:
            cvat_service.create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
                payload.job["project_id"],
                payload.job["assignee"]["username"]
                if payload.job["assignee"] is not None
                else "",
                payload.job["state"],
            )


def cvat_webhook_handler(cvat_webhook: dict) -> None:
    match cvat_webhook.event:
        case EventTypes.update_job.value:
            handle_update_job_event(cvat_webhook)
        case EventTypes.create_job.value:
            handle_create_job_event(cvat_webhook)
