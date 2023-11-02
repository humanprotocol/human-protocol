from random import choices, shuffle
from string import ascii_letters, punctuation
from typing import List

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound, IntegrityError

from annotation import create_user, register_annotator
from src.chain import EscrowInfo
from src.config import Config
from src.cron_jobs import process_pending_job_requests
from src.db import Session, JobRequest, Worker, Statuses, AnnotationProject

exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")


@exchange_oracle.post("/job/request")
async def register_job_request(escrow_info: EscrowInfo):
    """Adds a job request to the database, to be processed later."""
    # TODO: validation
    job_request = JobRequest(
        escrow_address=escrow_info.escrow_address, chain_id=escrow_info.chain_id
    )

    with Session() as session:
        session.add(job_request)
        session.commit()


@exchange_oracle.get("job/list")
async def list_available_jobs():
    """Lists available jobs."""
    # TODO: return more details
    j = select(JobRequest).where(JobRequest.status == Statuses.in_progress.value)
    with Session() as session:
        return [job.id for job in session.execute(j).all()]


@exchange_oracle.get("job/{job_id}/details")
async def get_job_details():
    raise NotImplementedError


@exchange_oracle.post("user/register")
async def register_worker(worker_address: str):
    """Registers a new user with the given wallet address."""
    if not validate_worker(worker_address):
        # TODO: return failed response
        raise NotImplementedError

    password = get_password()
    worker = Worker(worker_id=worker_address, password=password)
    with Session() as session:
        try:
            session.add(worker)
            session.commit()
            create_user(worker.id, worker.password)
        except IntegrityError:
            # TODO: return failed response
            session.rollback()
            raise NotImplementedError
        except ValueError:
            raise NotImplementedError

    return {"username": worker_address, "password": password}


@exchange_oracle.post("job/{job_id}/apply")
async def apply_for_job(worker_id: str, job_id: str):
    """Applies the given worker for the job. Registers and validates them if necessary"""
    w = select(Worker).where(Worker.id == worker_id)
    j = select(JobRequest).where(JobRequest.id == job_id)
    error_message = (
        f"Job application by worker {worker_id} for job {job_id} is invalid.\n"
    )
    with Session() as session:
        # get worker and job, make sure they exist
        try:
            worker: Worker = session.execute(w).one()
            job: JobRequest = session.execute(j).one()
        except NoResultFound:
            raise ValueError(error_message + "Could not retrieve Worker or Job.")

        if not worker.is_validated:
            raise ValueError(error_message + "Worker is not validated.")

        if job.status != Statuses.in_progress:
            raise ValueError(error_message + "Job is not in progress.")

        # get project to assign worker to
        projects: List[AnnotationProject] = [
            project for project in job.projects if project.status == Statuses.pending
        ]
        if len(projects) == 0:
            raise ValueError(error_message + "No available projects for job")
        shuffle(projects)
        project = projects[0]

        try:
            register_annotator(worker.id, project.id)
            project.worker = worker
            project.id = worker.id
        except Exception:
            raise NotImplementedError

        session.commit()
    return {
        "username": worker.id,
        "password": worker.password,
        "project_name": project.id,
        "url": Config.doccano.url(),
    }


async def validate_worker(worker_id: str):
    """Validates the given worker_id with the Reputation Oracle.

    Notes:
        - Currently, this just returns True, as there is no validation mechanism in place in the Reputation Oracle.
    """
    return True


def get_password():
    return choices(ascii_letters + punctuation, k=16)


@exchange_oracle.on_event("startup")
def startup():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        process_pending_job_requests,
        "interval",
        seconds=Config.cron_config.task_interval,
    )
