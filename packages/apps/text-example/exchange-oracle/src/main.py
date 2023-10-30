from fastapi import FastAPI

from src.chain import EscrowInfo

exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")


@exchange_oracle.post("/job/create")
async def register_job_request(escrow_info: EscrowInfo):
    raise NotImplementedError


@exchange_oracle.get("job/list")
async def list_available_jobs():
    """Lists available jobs."""
    # TODO: get list of in-progress jobs from database
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
