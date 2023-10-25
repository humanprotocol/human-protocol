from fastapi import FastAPI

from src.chain import EscrowInfo, get_manifest_url
from src.storage import download_manifest

exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")


@exchange_oracle.get("/")
async def debug():
    return "all good"


@exchange_oracle.post("/job/create")
async def create_job(escrow_info: EscrowInfo):
    """Webhook to create a new job. To be called by the JobLauncher."""

    # get manifest from escrow url
    s3_url = get_manifest_url(escrow_info)
    manifest = download_manifest(s3_url)

    # TODO: download datasets
    # TODO: create doccano project
    # transform data to doccano format
    # write data to doccano
    # TODO: write job id into db
    # TODO: return some success stuff
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
