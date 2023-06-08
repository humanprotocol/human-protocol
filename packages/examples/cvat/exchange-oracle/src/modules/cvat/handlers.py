from src.db import SessionLocal

from .api_calls import fetch_task_jobs
from .service import create_job, get_job_by_cvat_id, update_job


def handle_task_update_event(payload: dict):
    with SessionLocal.begin() as session:
        if "mode" in payload.before_update:
            if payload.task["mode"] == "annotation":
                jobs = fetch_task_jobs(payload.task["id"])
                for job in jobs.results:
                    create_job(
                        session,
                        job["id"],
                        job["task_id"],
                        job["assignee"]["username"]
                        if job["assignee"] is not None
                        else "",
                        job["state"],
                    )            


def handle_job_event(payload: dict):
    with SessionLocal.begin() as session:
        job = get_job_by_cvat_id(session, payload.job["id"])
        if not job:
            create_job(
                session,
                payload.job["id"],
                payload.job["task_id"],
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
