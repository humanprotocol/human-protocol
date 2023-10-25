from fastapi import FastAPI

from src.chain import EscrowInfo, get_manifest_url
from src.storage import (
    download_manifest,
    download_datasets,
    convert_taskdata_to_doccano,
)
from src.annotation import create_project

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

    # download job data
    job_dir = download_datasets(manifest)

    # FIXME: probably need some chunking since doccano does not allow individual assignment of tasks, will cross that bridge once we get there
    # convert data into doccano format
    doccano_filepath = convert_taskdata_to_doccano(job_dir)
    project = create_project(manifest, doccano_filepath)

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
