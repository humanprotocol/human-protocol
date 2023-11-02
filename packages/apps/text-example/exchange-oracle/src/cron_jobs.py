import shutil

from annotation import create_projects
from src.chain import EscrowInfo, get_manifest_url
from src.config import Config
from src.db import (
    Session,
    Statuses,
    JobRequest,
    AnnotationProject,
)
from storage import download_manifest, download_datasets, convert_taskdata_to_doccano


def process_pending_job_requests():
    with Session() as session:
        # get pending job requests
        requests = (
            session.query(JobRequest)
            .where(JobRequest.status == Statuses.pending.value)
            .limit(Config.cron_config.task_chunk_size)
        )

        # create annotation projects for each job request
        for job_request in requests:
            try:
                projects = set_up_projects_for_job(job_request)
                job_request.status = Statuses.in_progress.value
            except Exception:
                job_request.status = Statuses.failed.value
                projects = []

            # link projects to job
            for project in projects:
                session.add(AnnotationProject(id=project.id, job_request=job_request))
        session.commit()


def set_up_projects_for_job(job_request: JobRequest):
    """Creates a new job."""
    escrow_info = EscrowInfo(
        escrow_address=job_request.escrow_address, chain_id=job_request.chain_id
    )

    # get manifest from escrow url
    s3_url = get_manifest_url(escrow_info)
    manifest = download_manifest(s3_url)

    # download job data
    job_dir = download_datasets(manifest)

    # convert data into doccano format
    doccano_filepath = convert_taskdata_to_doccano(job_dir)
    projects = create_projects(manifest, doccano_filepath)

    # clean up directory
    shutil.rmtree(job_dir)

    return projects
