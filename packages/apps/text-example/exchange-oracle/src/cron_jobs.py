import shutil

from sqlalchemy import select

from annotation import create_projects, is_done, download_annotations, delete_project
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

def process_in_progress_job_requests():
    with Session() as session:
        # check and update project completion
        projects = session.query(AnnotationProject).where(AnnotationProject.status == Statuses.in_progress)
        for project in projects:
            if is_done(project.id):
                project.status = Statuses.completed.value

        # check and update request completion
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.in_progress)
        for request in requests:
            if all(project.status == Statuses.completed for project in request.projects):
                request.status = Statuses.completed
        session.commit()

def process_completed_job_requests():
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.in_progress).limit(Config.cron_config.task_chunk_size)
        for request in requests:
            for project in request.projects:
                try:
                    download_annotations(project=project)
                    project.status = Statuses.awaiting_upload
                except Exception:
                    project.status = Statuses.failed
                delete_project(project.id)
            request.status = Statuses.awaiting_upload
        session.commit()