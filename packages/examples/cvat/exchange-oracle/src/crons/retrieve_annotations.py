import logging

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_db_service
import src.services.webhook as oracle_db_service
from human_protocol_sdk.storage import Credentials, StorageClient
from src.core.config import CronConfig, StorageConfig
from src.core.constants import OracleWebhookTypes, ProjectStatuses
from src.db import SessionLocal
from src.handlers.annotation import get_annotations_handler
from src.utils.helpers import prepare_signature

LOG_MODULE = "[cron][cvat][retrieve_annotations]"
logger = logging.getLogger("app")


def retrieve_annotations() -> None:
    """
    Retrieves and stores completed annotations:
    1. Retrieves annotations from projects with "completed" status
    2. Postprocesses them
    3. Stores annotations in s3 bucket
    4. Prepares a webhook to recording oracle
    """
    try:
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            # Get completed projects from db
            projects = cvat_db_service.get_projects_by_status(
                session,
                ProjectStatuses.completed.value,
                limit=CronConfig.retrieve_annotations_chunk_size,
            )

            for project in projects:
                annotations = []
                annotations_handler = get_annotations_handler(project.job_type)
                # Check if all jobs within a project are completed
                if not cvat_db_service.is_project_completed(session, project.id):
                    cvat_db_service.update_project_status(
                        session, project.id, ProjectStatuses.annotation.value
                    )
                    break
                jobs = cvat_db_service.get_jobs_by_cvat_project_id(
                    session, project.cvat_id
                )

                # Collect raw annotations from CVAT and convert them into a recording oracle suitable format
                for job in jobs:
                    raw_annotations = cvat_api.get_job_annotations(job.cvat_id)
                    annotations = annotations_handler(
                        annotations,
                        raw_annotations,
                        project.bucket_url,
                        job.assignee,
                    )

                # Upload file with annotations to s3 storage
                storage_client = StorageClient(
                    StorageConfig.endpoint_url,
                    StorageConfig.region,
                    Credentials(
                        StorageConfig.access_key,
                        StorageConfig.secret_key,
                    ),
                    StorageConfig.secure,
                )
                files = storage_client.upload_files(
                    [annotations], StorageConfig.results_bucket_name
                )

                oracle_db_service.create_webhook(
                    session,
                    project.escrow_address,
                    project.chain_id,
                    OracleWebhookTypes.recording_oracle.value,
                    prepare_signature(
                        project.escrow_address,
                        project.chain_id,
                        f"{StorageConfig.bucket_url()}{files[0]['key']}",
                    ),
                    f"{StorageConfig.bucket_url()}{files[0]['key']}",
                )

                cvat_db_service.update_project_status(
                    session, project.id, ProjectStatuses.recorded.value
                )

        logger.info(f"{LOG_MODULE} Finishing cron job")

    except Exception as error:
        logger.error(f"{LOG_MODULE} {error}")
