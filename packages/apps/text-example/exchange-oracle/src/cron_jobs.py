import shutil

from urllib3.exceptions import MaxRetryError

from src.annotation import create_projects, is_done, download_annotations, delete_project
from src.chain import EscrowInfo, get_manifest_url
from src.config import Config
from src.db import (
    Session,
    Statuses,
    JobRequest,
    AnnotationProject, username_to_worker_address_map,
)
from src.storage import download_manifest, download_datasets, convert_taskdata_to_doccano, \
    convert_annotations_to_raw_results, upload_data

logger = Config.logging.get_logger()

def process_pending_job_requests():
    """Fetches pending jobs from the database and creates annotation projects to be assigned to workers."""
    logger.debug("Processing pending job requests.")

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
                logger.debug(f"Creating annotation projects for {job_request.id}")
                projects = set_up_projects_for_job(job_request)
                job_request.status = Statuses.in_progress.value
            except Exception:
                logger.exception(f"Could not set up annotation projects for {job_request.id}. Job failed.")
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
    """Fetches jobs for which the annotation is currently in progress and checks if the job is finished and updates their status accordingly."""
    logger.debug("Processing jobs in progress.")
    with Session() as session:
        # check and update project completion
        projects = session.query(AnnotationProject).where(AnnotationProject.status == Statuses.in_progress)
        for project in projects:
            if is_done(project.id):
                logger.debug(f"Project {project.id} is done.")
                project.status = Statuses.completed.value
        session.commit()

    with Session() as session:
        # check and update request completion
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.in_progress)
        for request in requests:
            if all(project.status == Statuses.completed for project in request.projects):
                logger.debug(f"Job {request.id} is done.")
                request.status = Statuses.completed
        session.commit()

def process_completed_job_requests():
    """Exports annotations from doccano and stores them locally. Cleans up unused projects in doccano."""
    logger.debug("Processing completed jobs.")
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.completed).limit(Config.cron_config.task_chunk_size)
        for request in requests:
            logger.debug(f"Start data export of job {request.id}")
            for project in request.projects:
                try:
                    logger.debug(f"Exporting data of project {project.id} of job {request.id}")
                    download_annotations(project_id=project.id, job_request_id=project.job_request_id)
                    project.status = Statuses.closed
                    delete_project(project.id)
                except Exception:
                    logger.exception(f"Could not process {project.id} of job {request.id}")
                    project.status = Statuses.failed

            # TODO: add completed percentage depending on how many projects failed?
            request.status = Statuses.awaiting_upload
            logger.debug(f"Finished data export {request.id}")
        session.commit()

# TODO: combine with previous stage?
def upload_completed_job_requests():
    """Converts data of completed job requests in the correct format for the recording oracle and uploads it to s3."""
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.awaiting_upload)
        for request in requests:
            logger.debug(f"Uploading data for {request.id}")
            try:
                id = str(request.id)
                data_dir = Config.storage_config.dataset_dir / id

                # convert doccano annotations into raw results format
                raw_results_file = convert_annotations_to_raw_results(data_dir, id, username_to_worker_address_map())

                # upload to s3
                upload_data(raw_results_file, content_type="application/json")

                # remove unused files
                shutil.rmtree(data_dir)

                request.status = Statuses.awaiting_closure
            except Exception:
                logger.exception(f"Could not upload data for job {request.id}.")
                request.status = Statuses.failed
        session.commit()

def notify_recording_oracle():
    """Notifies the recording oracle about a completed job to process."""
    with Session() as session:
        requests = session.query(JobRequest).where(JobRequest.status == Statuses.awaiting_closure)
        for request in requests:
            s3_url = Config.storage_config.results_s3_url(str(request.id))
            try:
                payload = {"escrow_address": request.escrow_address, "chain_id": request.chain_id, "s3_url": s3_url}
                logger.debug(f"Notifying recording oracle about job {request.id}. payload: {payload}")
                response = Config.http.request(
                    method='POST',
                    url=Config.human.recording_oracle_url,
                    json=payload
                )
                if response.status == 200:
                    request.status = Statuses.closed
                else:
                    logger.exception(f"Could not notify recording oracle about job {request.id}. Response: {response.status}. {response.json()}")
                    request.status = Statuses.failed
            except MaxRetryError:
                logger.exception(f"Could not notify recording oracle about job {request.id}")
                request.status = Statuses.failed
            except Exception:
                logger.exception(f"Could not notify recording oracle about job {request.id}")
                request.status = Statuses.failed
            session.commit()