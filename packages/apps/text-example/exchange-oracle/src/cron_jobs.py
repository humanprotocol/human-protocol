import shutil

from datetime import datetime
from pytz import UTC

from src.annotation import (
    create_projects,
    delete_project,
    download_annotations,
    is_done,
)
from src.chain import EscrowInfo, get_manifest_url, EventType, get_web3, sign_message
from src.config import Config
from src.db import (
    AnnotationProject,
    JobRequest,
    Session,
    Statuses,
    username_to_worker_address_map,
    stage_success,
    stage_failure,
)
from src.storage import (
    convert_annotations_to_raw_results,
    convert_taskdata_to_doccano,
    download_datasets,
    download_manifest,
    upload_data,
)
from urllib3.exceptions import MaxRetryError

logger = Config.logging.get_logger()


def process_pending_job_requests():
    """Fetches pending jobs from the database and creates annotation projects to be assigned to workers."""
    logger.info("Processing pending job requests.")

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
                logger.info(f"Creating annotation projects for {job_request.id}")
                projects, manifest = set_up_projects_for_job(job_request)

                if manifest.expiration_date is not None:
                    job_request.expires_at = datetime.utcfromtimestamp(
                        manifest.expiration_date
                    )
                    logger.info(
                        f"Updated expiration date for {job_request.id} to {job_request.expires_at}"
                    )

                job_request.description = manifest.requester_description
                job_request.reward_amount = (
                    manifest.task_bid_price
                )  # todo: double check: is this per task or per batch of tasks?
                logger.debug(f"Updated task details for for {job_request.id}.")
                stage_success(job_request)
            except Exception:
                logger.exception(
                    f"Could not set up annotation projects for {job_request.id}. Job failed."
                )
                stage_failure(job_request)
                projects = []

            # link projects to job
            for project in projects:
                session.add(
                    AnnotationProject(
                        id=project.id, name=project.name, job_request=job_request
                    )
                )
        session.commit()


def set_up_projects_for_job(job_request: JobRequest):
    """Creates a new job."""
    escrow_info = EscrowInfo(
        escrowAddress=job_request.escrow_address,
        chainId=job_request.chain_id,
        eventType=EventType.ESCROW_CREATED,
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

    return projects, manifest


def process_in_progress_job_requests():
    """Fetches jobs for which the annotation is currently in progress and checks if the job is finished and updates their status accordingly."""
    logger.info("Processing jobs in progress. Checking status.")
    with Session() as session:
        # check and update project completion
        projects = session.query(AnnotationProject).where(
            AnnotationProject.status == Statuses.in_progress
        )
        for project in projects:
            if is_done(project.id):
                logger.debug(f"Project {project.id} is done.")
                project.status = Statuses.completed.value
        session.commit()

    with Session() as session:
        # check and update request completion
        requests = session.query(JobRequest).where(
            JobRequest.status == Statuses.in_progress
        )
        for request in requests:
            if all(
                project.status == Statuses.completed for project in request.projects
            ):
                logger.info(f"All projects complete for job {request.id}. Job is done.")
                stage_success(request)
            if request.expires_at.replace(tzinfo=UTC) <= datetime.now().replace(
                tzinfo=UTC
            ):
                logger.info(f"Job {request.id} expired. Updating status.")
                stage_success(request)
        session.commit()


def process_completed_job_requests():
    """Exports annotations from doccano and stores them locally. Cleans up unused projects in doccano."""
    logger.info("Processing completed annotation jobs.")
    with Session() as session:
        requests = (
            session.query(JobRequest)
            .where(JobRequest.status == Statuses.completed)
            .limit(Config.cron_config.task_chunk_size)
        )
        for request in requests:
            logger.debug(f"Start data export of job {request.id}")
            for project in request.projects:
                try:
                    logger.debug(
                        f"Exporting data of project {project.id} of job {request.id}"
                    )
                    download_annotations(
                        project_id=project.id, job_request_id=project.job_request_id
                    )
                    project.status = Statuses.closed
                    delete_project(project.id)
                except Exception:
                    logger.exception(
                        f"Could not process {project.id} of job {request.id}"
                    )
                    project.status = Statuses.failed

            logger.info(f"Data exported for job {request.id}.")
            stage_success(request)
        session.commit()


def _reverse_label_map(label_set: dict[str, dict[str, str]]):
    """Returns a mapping from label text to label id, given a requester_restricted_answer_set.
    See test/data/manifest.json for details.
    Args:
        label_set: A dictionary mapping label ids to a mapping from language codes to label texts.

    Example:
        >>> labels = { "0": { "en":  "Acting" }, "1": { "en":  "Story" }, "2": { "en":  "Plot" }}
        >>> print(_reverse_label_map(labels))
        {'Acting': '0', 'Story': '1', 'Plot': '2'}
    """
    reverse_map = {}
    for label_id, language_dict in label_set.items():
        reverse_map.update({label: label_id for label in language_dict.values()})
    return reverse_map


def upload_completed_job_requests():
    """Converts data of completed job requests in the correct format for the recording oracle and uploads it to s3."""
    logger.info(f"Uploading data for completed job requests.")

    with Session() as session:
        requests = session.query(JobRequest).where(
            JobRequest.status == Statuses.awaiting_upload
        )
        for request in requests:
            logger.debug(f"Uploading data for {request.id}")
            try:
                id = str(request.id)
                data_dir = Config.storage_config.dataset_dir / id

                # create reverse label map
                info = EscrowInfo(
                    chainId=request.chain_id,
                    escrowAddress=request.escrow_address,
                    eventType=EventType.ESCROW_CREATED,
                )
                manifest = download_manifest(get_manifest_url(info))

                # convert doccano annotations into raw results format
                raw_results_file = convert_annotations_to_raw_results(
                    data_dir,
                    id,
                    username_to_worker_address_map(),
                    _reverse_label_map(manifest.requester_restricted_answer_set),
                )

                # upload to s3
                upload_data(raw_results_file, content_type="application/json")

                # remove unused files
                shutil.rmtree(data_dir)

                stage_success(request)
                logger.info(f"Data uploaded for job {request.id}")
            except Exception:
                logger.exception(f"Could not upload data for job {request.id}.")
                stage_failure(request)
        session.commit()


def notify_recording_oracle():
    """Notifies the recording oracle about a completed job to process."""
    logger.info(f"Notifying recording oracle about finished annotation jobs.")
    with Session() as session:
        requests = session.query(JobRequest).where(
            JobRequest.status == Statuses.awaiting_closure
        )
        for request in requests:
            s3_url = Config.storage_config.results_s3_url(str(request.id))
            cfg = Config.blockchain_config_from_id(request.chain_id)
            try:
                payload = {
                    "escrow_address": request.escrow_address,
                    "chain_id": request.chain_id,
                    "solution_url": s3_url,
                }

                # generate human signature
                w3 = get_web3(cfg.chain_id)
                signature, _ = sign_message(payload, w3, cfg.private_key)

                headers = {"Human-Signature": signature}

                logger.debug(
                    f"Notifying recording oracle about job {request.id}. payload: {payload}"
                )
                response = Config.http.request(
                    method="POST",
                    url=Config.human.recording_oracle_url,
                    json=payload,
                    headers=headers,
                )
                if response.status == 200:
                    stage_success(request)
                    logger.info(
                        f"Recording oracle notified about job {request.id}. Job is complete."
                    )
                else:
                    logger.exception(
                        f"Could not notify recording oracle about job {request.id}. Response: {response.status}. {response.json()}"
                    )
                    stage_failure(request)
            except MaxRetryError:
                logger.exception(
                    f"Could not notify recording oracle about job {request.id}"
                )
                stage_failure(request)
            except Exception:
                logger.exception(
                    f"Could not notify recording oracle about job {request.id}"
                )
                stage_failure(request)
            session.commit()
