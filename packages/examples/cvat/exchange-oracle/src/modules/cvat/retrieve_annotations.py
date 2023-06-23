import logging

from human_protocol_sdk.storage import StorageClient, Credentials

from src.db import SessionLocal
from src.config import CronConfig, StorageConfig

from src.modules.cvat.constants import (
    ProjectStatuses,
    TaskStatuses,
    JobStatuses,
    JobTypes,
)
from src.modules.cvat.format_annotations import process_image_label_binary_annotations

import src.modules.cvat.api_calls as cvat_api
import src.modules.cvat.service as cvat_service

LOG_MODULE = "[cron][cvat][retrieve_annotations]"
logger = logging.getLogger("app")


def retrieve_annotations() -> None:
    """
    Retrieves and stores completed annotations:
    1. Retrieves annotations from projects with "completed" status
    2. Postprocesses them
    3. Stores annotations in s3 bucket
    4. Sends a webhook to recording oracle
    """
    try:
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            # Get completed projects from db
            projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.completed,
                limit=CronConfig.retrieve_annotations_chunk_size,
            )

            for project in projects:
                annotations = []
                tasks = cvat_service.get_tasks_by_cvat_project_id(
                    session, project.cvat_id
                )
                if not all(task.status == TaskStatuses.completed for task in tasks):
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.annotation
                    )
                    continue
                for task in tasks:
                    jobs = cvat_service.get_jobs_by_cvat_task_id(session, task.cvat_id)
                    if not all(job.status == JobStatuses.completed for job in jobs):
                        cvat_service.update_task_status(
                            session, task.id, TaskStatuses.annotation
                        )
                        cvat_service.update_project_status(
                            session, project.id, ProjectStatuses.annotation
                        )
                        break
                    for job in jobs:
                        raw_annotations = cvat_api.get_job_annotations(job.cvat_id)
                        match project.job_type:
                            case JobTypes.image_label_binary.value:
                                annotations = process_image_label_binary_annotations(
                                    annotations,
                                    raw_annotations,
                                    project.bucket_url,
                                    job.assignee,
                                )
                storage_client = StorageClient(
                    StorageConfig.endpoint_url,
                    StorageConfig.region,
                    Credentials(
                        StorageConfig.access_key,
                        StorageConfig.secret_key,
                    ),
                )
                files = storage_client.upload_files(
                    [annotations], StorageConfig.results_bucket_name
                )

                cvat_service.update_project_status(
                    session, project.id, ProjectStatuses.recorded
                )

        logger.info(f"{LOG_MODULE}[track_completed_projects] Finishing cron job")

    except Exception as error:
        logger.error(f"{LOG_MODULE}[track_completed_projects] {error}")
