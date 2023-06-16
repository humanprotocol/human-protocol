import logging
import requests

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.constants import ProjectStatuses, TaskStatuses, JobStatuses
import src.modules.cvat.service as cvat_service

LOG_MODULE = "[cron][cvat]"
logger = logging.getLogger("app")


def track_completed_projects() -> None:
    """
    Tracks completed projects:
    1. Retrieves projects with "annotation" status
    2. Retrieves tasks related to this project
    3. If all tasks are completed -> updates project status to "completed"
    """
    try:
        logger.info(f"{LOG_MODULE}[track_completed_projects] Starting cron job")
        with SessionLocal.begin() as session:
            # Get active projects from db
            projects = cvat_service.get_projects_by_status(
                session,
                ProjectStatuses.annotation,
                limit=CronConfig.track_completed_projects_chunk_size,
            )

            for project in projects:
                tasks = cvat_service.get_tasks_by_cvat_project_id(
                    session, project.cvat_id
                )
                if all(task.status == TaskStatuses.completed for task in tasks):
                    cvat_service.update_project_status(
                        session, project.id, ProjectStatuses.completed
                    )

        logger.info(f"{LOG_MODULE}[track_completed_projects] Finishing cron job")

    except Exception as error:
        logger.error(f"{LOG_MODULE}[track_completed_projects] {error}")


def track_completed_tasks() -> None:
    """
    Tracks completed tasks:
    1. Retrieves tasks with "annotation" status
    2. Retrieves jobs related to this task
    3. If all jobs are completed -> updates task status to "completed"
    """
    try:
        logger.info(f"{LOG_MODULE}[track_completed_tasks] Starting cron job")
        with SessionLocal.begin() as session:
            tasks = cvat_service.get_tasks_by_status(
                session,
                TaskStatuses.annotation,
                limit=CronConfig.track_completed_tasks_chunk_size,
            )

            for task in tasks:
                jobs = cvat_service.get_jobs_by_cvat_task_id(session, task.cvat_id)
                if all(job.status == JobStatuses.completed for job in jobs):
                    cvat_service.update_task_status(
                        session, task.id, TaskStatuses.completed
                    )

        logger.info(f"{LOG_MODULE}[track_completed_tasks] Finishing cron job")

    except Exception as error:
        logger.error(f"{LOG_MODULE}[track_completed_tasks] {error}")
