import shutil
from random import shuffle
from typing import List

from sqlalchemy import select

from annotation import create_projects, create_user, register_annotator
from src.chain import EscrowInfo, get_manifest_url
from src.config import Config
from src.db import (
    Session,
    Statuses,
    JobRequest,
    JobApplication,
    AnnotationProject,
    Worker,
)
from storage import download_manifest, download_datasets, convert_taskdata_to_doccano


def process_pending_applications():
    q = (
        select(JobApplication)
        .where(JobApplication.status == Statuses.pending.value)
        .limit(Config.cron_config.task_chunk_size)
    )
    with Session() as session:
        for application in session.execute(q).all():
            job: JobRequest = application.job_request
            worker: Worker = application.worker

            # validate job application
            error_message = (
                f"Job application by worker {worker.id} for job {job.id} is invalid.\n"
            )
            if job.status != Statuses.in_progress:
                raise ValueError(error_message + "Job is not in progress.")
            if not worker.is_validated:
                raise ValueError(error_message + "Worker is not validated.")

            # get available projects
            projects: List[AnnotationProject] = [
                project
                for project in job.projects
                if project.status == Statuses.pending
            ]

            if len(projects) == 0:
                raise ValueError(error_message + "No available projects for job")

            shuffle(projects)
            project = projects[0]

            # create user and register in project with doccano
            create_user(worker.id, worker.password)
            register_annotator(worker.id, project.id)

            # update project
            project.worker = worker
            project.id = worker.id

            session.commit()


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
