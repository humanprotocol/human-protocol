from src.db import SessionLocal

import src.modules.cvat.service as cvat_service


def handle_update_job_event(payload: dict):
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


def handle_create_job_event(payload: dict):
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
