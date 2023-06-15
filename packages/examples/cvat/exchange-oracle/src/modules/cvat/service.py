import uuid

from sqlalchemy import update
from sqlalchemy.sql import select
from sqlalchemy.orm import Session

from .constants import ProjectStatuses, TaskStatuses, JobStatuses
from .model import Project, Task, Job


def create_project(session: Session, cvat_id: int):
    """
    Create a project from CVAT.
    """
    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        cvat_id=cvat_id,
        status=ProjectStatuses.annotation.value,
    )

    session.add(project)

    return project_id


def create_task(
    session: Session, cvat_id: int, cvat_project_id: int, status: TaskStatuses
):
    """
    Create a task from CVAT.
    """
    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        cvat_id=cvat_id,
        cvat_project_id=cvat_project_id,
        status=status,
    )

    session.add(task)

    return task_id


def create_job(
    session: Session,
    cvat_id: int,
    cvat_task_id: int,
    cvat_project_id: int,
    assignee: str,
    status: JobStatuses,
):
    """
    Create a job from CVAT.
    """
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        cvat_id=cvat_id,
        cvat_task_id=cvat_task_id,
        cvat_project_id=cvat_project_id,
        status=status,
        assignee=assignee,
    )

    session.add(job)

    return job_id


def get_job_by_cvat_id(session: Session, cvat_id: int):
    job_query = select(Job).where(Job.cvat_id == cvat_id)
    job = session.execute(job_query).scalars().first()

    return job


def update_job(session: Session, id: str, fields: dict):
    upd = update(Job).where(Job.id == id).values(fields)
    session.execute(upd)
