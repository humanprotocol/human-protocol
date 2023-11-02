from random import choices
from string import ascii_letters, punctuation

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound

from src.chain import EscrowInfo
from src.config import Config
from src.cron_jobs import process_pending_job_requests
from src.db import Session, JobRequest, Worker, JobApplication, Statuses

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


@exchange_oracle.post("job/{job_id}/apply")
async def apply_for_job(worker_id: str, job_id: str):
    """Applies the given worker for the job. Registers and validates them if necessary"""
    w = select(Worker).where(Worker.id == worker_id)
    with Session() as session:
        try:
            worker = session.execute(w).one()
        except NoResultFound:
            if await validate_worker(worker_id):
                worker = Worker(
                    id=worker_id, is_validated=True, password=get_password()
                )
                session.add(worker)
            else:
                # TODO: return error response
                raise NotImplementedError

        session.add(JobApplication(worker_id=worker_id, job_request_id=job_id))
        session.commit()


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
