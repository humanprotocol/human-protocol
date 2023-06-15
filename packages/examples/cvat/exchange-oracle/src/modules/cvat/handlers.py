from src.db import SessionLocal

from .service import create_job, get_job_by_cvat_id, update_job


def handle_update_job_event(payload: dict):
    with SessionLocal.begin() as session:
        job = get_job_by_cvat_id(session, payload.job["id"])
        if not job:
            create_job(
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
                fields = {
                    "assignee": payload.job["assignee"]["username"]
                    if payload.job["assignee"]
                    else "",
                }
            if "state" in payload.before_update:
                fields = {"status": payload.job["state"]}
            update_job(session, job.id, fields)


def handle_create_job_event(payload: dict):
    with SessionLocal.begin() as session:
        job = get_job_by_cvat_id(session, payload.job["id"])
        if not job:
            create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
                payload.job["project_id"],
                payload.job["assignee"]["username"]
                if payload.job["assignee"] is not None
                else "",
                payload.job["state"],
            )
