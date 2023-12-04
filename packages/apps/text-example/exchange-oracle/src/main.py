from http import HTTPStatus
from random import choices, shuffle
from string import ascii_letters, punctuation
from typing import List
from uuid import uuid4

from apscheduler.schedulers.background import BackgroundScheduler
from doccano_client.exceptions import DoccanoAPIError
from fastapi import FastAPI, HTTPException
from human_protocol_sdk.escrow import EscrowUtils, EscrowClientError
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound, IntegrityError

import src.cron_jobs as cron_jobs
from src.annotation import create_user, register_annotator, UserRegistrationInfo
from src.chain import EscrowInfo, validate_escrow
from src.config import Config
from src.db import Session, JobRequest, Worker, Statuses, AnnotationProject


class Endpoints:
    JOB_REQUEST = "/job/request"
    JOB_LIST = "/job/list"
    JOB_APPLY = "/job/{job_id}/apply"
    USER_REGISTER = "/user/register"

class Errors:
    INVALID_ESCROW_INFO = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Escrow info contains invalid information.")
    NO_ESCROW_FOUND = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="No escrow found under given address.")
    ESCROW_VALIDATION_FAILED = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Escrow invalid.")
    WORKER_VALIDATION_FAILED = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Worker could not be verified.")
    WORKER_CREATION_FAILED = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Worker could not be registered. A user with the given username might already exist.")
    WORKER_ALREADY_REGISTERED = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Worker could not be registered. Wallet address already registered.")
    ADDRESS_INVALID = HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Address is not a valid address.")


exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")

@exchange_oracle.post(Endpoints.JOB_REQUEST)
async def register_job_request(escrow_info: EscrowInfo):
    """Adds a job request to the database, to be processed later."""
    # validate escrow info
    try:
        escrow = EscrowUtils.get_escrow(
            escrow_info.chain_id,
            escrow_info.escrow_address.lower()
        )
    except EscrowClientError as e:
        raise Errors.INVALID_ESCROW_INFO

    if escrow is None:
        raise Errors.NO_ESCROW_FOUND
    try:
        validate_escrow(escrow)
    except ValueError as e:
        raise Errors.ESCROW_VALIDATION_FAILED

    # add job once all validations were successful
    with Session() as session:
        id = str(uuid4())
        job_request = JobRequest(
            id=id, escrow_address=escrow_info.escrow_address, chain_id=escrow_info.chain_id
        )
        session.add(job_request)
        session.commit()

    return {"id": id}

@exchange_oracle.get(Endpoints.JOB_LIST)
async def list_available_jobs():
    """Lists available jobs."""
    # TODO: return more details
    # TODO: validate header
    with Session() as session:
        return [job.id for job in session.query(JobRequest).where(JobRequest.status == Statuses.in_progress.value).all()]


@exchange_oracle.post(Endpoints.USER_REGISTER)
async def register_worker(user_info: UserRegistrationInfo):
    """Registers a new user with the given wallet address."""
    if not await validate_worker(user_info.worker_address):
        raise Errors.WORKER_VALIDATION_FAILED

    with Session() as session:
        # check if wallet is already registered
        if session.query(Worker).where(Worker.id == user_info.worker_address).one_or_none() is not None:
            raise Errors.WORKER_ALREADY_REGISTERED

        try:
            password = ''.join(choices(ascii_letters + punctuation, k=16))
            worker = Worker(id=user_info.worker_address, password=password, is_validated=True, username=user_info.name)
            create_user(user_info.name, worker.password)
            session.add(worker)
            session.commit()
        except DoccanoAPIError as e:
            session.rollback()
            raise Errors.WORKER_CREATION_FAILED
        except IntegrityError as e:
            session.rollback()
            print(e)
            raise Errors.WORKER_CREATION_FAILED

    return {"username": user_info.name, "password": password}


@exchange_oracle.post(Endpoints.JOB_APPLY)
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
            raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail="Could not register worker for job.")

        if not worker.is_validated:
            raise HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Worker is not verified.")

        if job.status != Statuses.in_progress:
            raise HTTPException(status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Job is not available.")

        # get project to assign worker to
        projects: List[AnnotationProject] = [
            project for project in job.projects if project.status == Statuses.pending
        ]
        if len(projects) == 0:
            raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail="Could not find suitable annotation project for worker.")
        shuffle(projects)
        project = projects[0]

        try:
            register_annotator(worker.id, project.id)
            project.worker = worker
            project.id = worker.id
        except Exception:
            raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail="Could not assign worker to annotation project.")

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


@exchange_oracle.on_event("startup")
def startup():
    scheduler = BackgroundScheduler()
    tasks = [
        cron_jobs.process_pending_job_requests,
        cron_jobs.process_in_progress_job_requests,
        cron_jobs.process_completed_job_requests,
        cron_jobs.upload_completed_job_requests,
        cron_jobs.notify_recording_oracle,
    ]
    for task in tasks:
        scheduler.add_job(
            task,
            "interval",
            seconds=Config.cron_config.task_interval,
        )
