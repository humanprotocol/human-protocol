from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from src.chain import EscrowInfo
from src.db import Session, JobRequest
from src.config import Config
from src.cron_jobs import process_pending_job_requests

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
    raise NotImplementedError


@exchange_oracle.get("job/{job_id}/details")
async def get_job_details():
    raise NotImplementedError


@exchange_oracle.post("job/{job_id}/apply")
async def apply_for_job(worker_id: str):
    """Applies the given worker for the job."""
    # TODO: validate user
    # TODO: if success
    # create doccano user if not exists
    # register user for doccano project
    # check current progress and assign tasks dynamically to user
    # TODO: if fail
    # return error response
    raise NotImplementedError


@exchange_oracle.on_event("startup")
def startup():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        process_pending_job_requests,
        "interval",
        seconds=Config.cron_config.task_interval,
    )
