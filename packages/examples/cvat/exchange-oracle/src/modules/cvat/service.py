import uuid

from sqlalchemy import update
from sqlalchemy.sql import select
from sqlalchemy.orm import Session

from .constants import ProjectStatuses, TaskStatuses, JobStatuses
from .model import Project, Task, Job


# Project
def create_project(
    session: Session, cvat_id: int, job_type: str, escrow_address: str, bucket_url: str
) -> id:
    """
    Create a project from CVAT.
    """
    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        cvat_id=cvat_id,
        status=ProjectStatuses.annotation.value,
        job_type=job_type,
        escrow_address=escrow_address,
        bucket_url=bucket_url,
    )

    session.add(project)

    return project_id


def get_project_by_id(session: Session, project_id: id):
    project_query = select(Project).where(Project.id == project_id)
    project = session.execute(project_query).scalars().first()

    return project


def get_projects_by_status(session: Session, status: ProjectStatuses, limit: int = 5):
    projects = (
        session.query(Project)
        .where(
            Project.status == status,
        )
        .limit(limit)
        .all()
    )
    return projects


def update_project_status(session: Session, project_id: id, status: ProjectStatuses):
    if status not in ProjectStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Project).where(Project.id == project_id).values(status=status)
    session.execute(upd)


# Task
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


def get_task_by_id(session: Session, task_id: id):
    task_query = select(Task).where(Task.id == task_id)
    task = session.execute(task_query).scalars().first()

    return task


def get_tasks_by_status(session: Session, status: TaskStatuses):
    tasks = (
        session.query(Task)
        .where(
            Task.status == status,
        )
        .all()
    )
    return tasks


def update_task_status(session: Session, task_id: id, status: TaskStatuses):
    if status not in TaskStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Task).where(Task.id == task_id).values(status=status)
    session.execute(upd)


def get_tasks_by_cvat_project_id(session: Session, cvat_project_id: int):
    tasks = (
        session.query(Task)
        .where(
            Task.cvat_project_id == cvat_project_id,
        )
        .all()
    )
    return tasks


# Job
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


def get_job_by_id(session: Session, job_id: id):
    job_query = select(Job).where(Job.id == job_id)
    job = session.execute(job_query).scalars().first()

    return job


def get_job_by_cvat_id(session: Session, cvat_id: int):
    job_query = select(Job).where(Job.cvat_id == cvat_id)
    job = session.execute(job_query).scalars().first()

    return job


def update_job_assignee(session: Session, job_id: id, assignee: str):
    upd = update(Job).where(Job.id == job_id).values(assignee=assignee)
    session.execute(upd)


def update_job_status(session: Session, job_id: id, status: JobStatuses):
    if status not in JobStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Job).where(Job.id == job_id).values(status=status)
    session.execute(upd)


def get_jobs_by_cvat_task_id(session: Session, cvat_task_id: int):
    jobs = (
        session.query(Job)
        .where(
            Job.cvat_task_id == cvat_task_id,
        )
        .all()
    )
    return jobs
