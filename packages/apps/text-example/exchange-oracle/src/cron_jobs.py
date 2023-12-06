import shutil

from urllib3.exceptions import MaxRetryError

from src.annotation import create_projects, is_done, download_annotations, delete_project
from src.chain import EscrowInfo, get_manifest_url
from src.config import Config
from src.db import (
    Session,
    Statuses,
    JobRequest,
    AnnotationProject,
)
from src.storage import download_manifest, download_datasets, convert_taskdata_to_doccano, \
    convert_annotations_to_raw_results, upload_data


def process_pending_job_requests():
    with Session() as session:
        # get pending job requests
        requests = (
            session.query(JobRequest)
            .where(JobRequest.status == Statuses.pending.value)
            .limit(Config.cron_config.task_chunk_size)
        ) # TODO: Log how much percent of the limit was actually processed

        # create annotation projects for each job request
        for job_request in requests:
            try:
                projects = set_up_projects_for_job(job_request)
                job_request.status = Statuses.in_progress.value
            except Exception as e:
                job_request.status = Statuses.failed.value
                projects = []

            # link projects to job
            for project in projects:
                session.add(AnnotationProject(id=project.id, name=project.name, job_request=job_request))
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
        session.commit()

    with Session() as session:
        # check and update request completion
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.in_progress)
        for request in requests:
            if all(project.status == Statuses.completed for project in request.projects):
                request.status = Statuses.completed
        session.commit()

def process_completed_job_requests():
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.completed).limit(Config.cron_config.task_chunk_size)
        for request in requests:
            for project in request.projects:
                try:
                    download_annotations(project_id=project.id, job_request_id=project.job_request_id)
                    project.status = Statuses.closed
                    delete_project(project.id)
                except Exception:
                    project.status = Statuses.failed

            # TODO: add completed percentage depending on how many projects failed?
            request.status = Statuses.awaiting_upload
        session.commit()

# TODO: combine with previous stage?
def upload_completed_job_requests():
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.awaiting_upload)
        for request in requests:
            try:
                id = str(request.id)
                data_dir = Config.storage_config.dataset_dir / id

                # convert doccano annotations into raw results format
                raw_results_file = convert_annotations_to_raw_results(data_dir, id)

                # upload to s3
                upload_data(raw_results_file, content_type="application/json")

                # remove unused files
                shutil.rmtree(data_dir)

                request.status = Statuses.awaiting_closure
            except Exception:
                request.status = Statuses.failed
        session.commit()

def notify_recording_oracle():
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.awaiting_closure)
        for request in requests:
            s3_url = Config.storage_config.results_s3_url(str(request.id))
            try:
                response = Config.http.request(
                    method='POST',
                    url=Config.recording_oracle_url,
                    json={"escrow_address": request.escrow_address, "chain_id": request.chain_id, "s3_url": s3_url}
                )
                if response.status == 200:
                    request.status = Statuses.closed
                else:
                    request.status = Statuses.failed
            except MaxRetryError:
                request.status = Statuses.failed
            session.commit()