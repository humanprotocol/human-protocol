import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import ColumnExpressionArgument, delete, insert, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import select

from src.core.types import AssignmentStatus, JobStatuses, ProjectStatuses, TaskStatus
from src.models.cvat import Assignment, DataUpload, Image, Job, Project, Task, User
from src.utils.time import utcnow


# Project
def create_project(
    session: Session,
    cvat_id: int,
    cvat_cloudstorage_id: int,
    job_type: str,
    escrow_address: str,
    chain_id: int,
    bucket_url: str,
    cvat_webhook_id: Optional[int] = None,
) -> str:
    """
    Create a project from CVAT.
    """
    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        cvat_id=cvat_id,
        cvat_cloudstorage_id=cvat_cloudstorage_id,
        status=ProjectStatuses.annotation.value,
        job_type=job_type,
        escrow_address=escrow_address,
        chain_id=chain_id,
        bucket_url=bucket_url,
        cvat_webhook_id=cvat_webhook_id,
    )

    session.add(project)

    return project_id


def get_project_by_id(session: Session, project_id: str) -> Optional[Project]:
    project_query = select(Project).where(Project.id == project_id)
    project = session.execute(project_query).scalars().first()

    return project


def get_project_by_escrow_address(session: Session, escrow_address: str) -> Optional[Project]:
    project_query = select(Project).where(Project.escrow_address == escrow_address)
    project = session.execute(project_query).scalars().first()

    return project


def get_projects_by_status(
    session: Session, status: ProjectStatuses, limit: int = 5
) -> List[Project]:
    projects = (
        session.query(Project)
        .where(
            Project.status == status.value,
        )
        .limit(limit)
        .all()
    )
    return projects


def get_available_projects(session: Session, limit: int = 10) -> List[Project]:
    return (
        session.query(Project)
        .where(
            (Project.status == ProjectStatuses.annotation.value)
            & Project.jobs.any(
                (Job.status == JobStatuses.new)
                & ~Job.assignments.any(Assignment.status == AssignmentStatus.created.value)
            )
        )
        .distinct()
        .limit(limit)
        .all()
    )


def get_projects_by_assignee(
    session: Session, wallet_address: Optional[str] = None, limit: int = 10
) -> List[Project]:
    return (
        session.query(Project)
        .where(
            Project.jobs.any(
                Job.assignments.any(
                    (Assignment.user_wallet_address == wallet_address)
                    & Assignment.status.in_(
                        [
                            AssignmentStatus.created,
                            AssignmentStatus.completed,
                            AssignmentStatus.canceled,
                        ]
                    )
                )
            )
        )
        .distinct()
        .limit(limit)
        .all()
    )


def update_project_status(session: Session, project_id: str, status: ProjectStatuses) -> None:
    upd = update(Project).where(Project.id == project_id).values(status=status.value)
    session.execute(upd)


def delete_project(session: Session, project_id: str) -> None:
    project = session.query(Project).filter_by(id=project_id).first()
    session.delete(project)


def is_project_completed(session: Session, project_id: str) -> bool:
    project = get_project_by_id(session, project_id)
    jobs = get_jobs_by_cvat_project_id(session, project.cvat_id)
    if len(jobs) > 0 and all(job.status == JobStatuses.completed.value for job in jobs):
        return True
    else:
        return False


# Task
def create_task(session: Session, cvat_id: int, cvat_project_id: int, status: TaskStatus) -> str:
    """
    Create a task from CVAT.
    """
    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        cvat_id=cvat_id,
        cvat_project_id=cvat_project_id,
        status=status.value,
    )

    session.add(task)

    return task_id


def get_task_by_id(session: Session, task_id: str) -> Optional[Task]:
    task_query = select(Task).where(Task.id == task_id)
    task = session.execute(task_query).scalars().first()

    return task


def get_tasks_by_cvat_id(session: Session, task_ids: List[int]) -> List[Task]:
    return session.query(Task).where(Task.cvat_id.in_(task_ids)).all()


def get_tasks_by_status(session: Session, status: TaskStatus) -> List[Task]:
    tasks = (
        session.query(Task)
        .where(
            Task.status == status.value,
        )
        .all()
    )
    return tasks


def update_task_status(session: Session, task_id: int, status: TaskStatus) -> None:
    upd = update(Task).where(Task.id == task_id).values(status=status.value)
    session.execute(upd)


def get_tasks_by_cvat_project_id(session: Session, cvat_project_id: int) -> List[Task]:
    tasks = (
        session.query(Task)
        .where(
            Task.cvat_project_id == cvat_project_id,
        )
        .all()
    )
    return tasks


def create_data_upload(
    session: Session,
    cvat_task_id: int,
):
    upload_id = str(uuid.uuid4())
    upload = DataUpload(
        id=upload_id,
        task_id=cvat_task_id,
    )

    session.add(upload)

    return upload_id


def get_active_task_uploads_by_task_id(session: Session, task_ids: List[int]) -> List[DataUpload]:
    return session.query(DataUpload).where(DataUpload.task_id.in_(task_ids)).all()


def get_active_task_uploads(session: Session, *, limit: int = 10) -> List[DataUpload]:
    return session.query(DataUpload).limit(limit).all()


def finish_uploads(session: Session, uploads: list[DataUpload]) -> None:
    statement = delete(DataUpload).where(DataUpload.id.in_([upload.id for upload in uploads]))
    session.execute(statement)


# Job
def create_job(
    session: Session,
    cvat_id: int,
    cvat_task_id: int,
    cvat_project_id: int,
    status: JobStatuses = JobStatuses.new,
) -> str:
    """
    Create a job from CVAT.
    """
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        cvat_id=cvat_id,
        cvat_task_id=cvat_task_id,
        cvat_project_id=cvat_project_id,
        status=status.value,
    )

    session.add(job)

    return job_id


def get_job_by_id(session: Session, job_id: str) -> Optional[Job]:
    job_query = select(Job).where(Job.id == job_id)
    job = session.execute(job_query).scalars().first()

    return job


def get_jobs_by_cvat_id(session: Session, cvat_ids: List[int]) -> List[Job]:
    return session.query(Job).where(Job.cvat_id.in_(cvat_ids)).all()


def update_job_status(session: Session, job_id: int, status: JobStatuses) -> None:
    upd = update(Job).where(Job.id == job_id).values(status=status.value)
    session.execute(upd)


def get_jobs_by_cvat_task_id(session: Session, cvat_task_id: int) -> List[Job]:
    jobs = (
        session.query(Job)
        .where(
            Job.cvat_task_id == cvat_task_id,
        )
        .all()
    )
    return jobs


def get_jobs_by_cvat_project_id(session: Session, cvat_project_id: int) -> List[Job]:
    jobs = (
        session.query(Job)
        .where(
            Job.cvat_project_id == cvat_project_id,
        )
        .all()
    )
    return jobs


# Users


def put_user(session: Session, wallet_address: str, cvat_email: str, cvat_id: int) -> User:
    """
    Bind a CVAT username to a HUMAN App user
    """
    assert not (
        bool(cvat_email) ^ bool(cvat_id)
    ), "cvat_email and cvat_id cannot be used separately"

    user = User(wallet_address=wallet_address, cvat_email=cvat_email, cvat_id=cvat_id)

    session.merge(user)

    return user


def get_user_by_id(session: Session, wallet_address: str) -> Optional[User]:
    return session.query(User).where(User.wallet_address == wallet_address).first()


# Assignments


def create_assignment(
    session: Session,
    wallet_address: str,
    cvat_job_id: int,
    expires_at: datetime,
) -> str:
    obj_id = str(uuid.uuid4())
    assignment = Assignment(
        id=obj_id,
        user_wallet_address=wallet_address,
        cvat_job_id=cvat_job_id,
        expires_at=expires_at,
    )

    session.add(assignment)

    return obj_id


def get_assignments_by_id(session: Session, ids: List[str]) -> List[Assignment]:
    return session.query(Assignment).where(Assignment.id.in_(ids)).all()


def get_latest_assignment_by_cvat_job_id(
    session: Session, cvat_job_id: int
) -> Optional[Assignment]:
    return (
        session.query(Assignment)
        .where(Assignment.cvat_job_id == cvat_job_id)
        .order_by(Assignment.created_at.desc())
        .first()
    )


def get_unprocessed_expired_assignments(session: Session, limit: int = 10) -> List[Assignment]:
    return (
        session.query(Assignment)
        .where(
            (Assignment.status == AssignmentStatus.created.value)
            & (Assignment.completed_at == None)
            & (Assignment.expires_at <= utcnow())
        )
        .limit(limit)
        .all()
    )


def get_active_assignments(session: Session, limit: int = 10) -> List[Assignment]:
    return (
        session.query(Assignment)
        .where(
            (Assignment.status == AssignmentStatus.created.value)
            & (Assignment.completed_at == None)
            & (Assignment.expires_at <= utcnow())
        )
        .limit(limit)
        .all()
    )


def update_assignment(
    session: Session,
    id: str,
    *,
    status: AssignmentStatus,
    completed_at: Optional[datetime] = None,
):
    statement = (
        update(Assignment)
        .where(Assignment.id == id)
        .values(completed_at=completed_at, status=status.value)
    )
    session.execute(statement)


def cancel_assignment(session: Session, assignment_id: str):
    update_assignment(session, assignment_id, status=AssignmentStatus.canceled)


def expire_assignment(session: Session, assignment_id: str):
    update_assignment(session, assignment_id, status=AssignmentStatus.expired)


def complete_assignment(session: Session, assignment_id: str, completed_at: datetime):
    update_assignment(
        session,
        assignment_id,
        completed_at=completed_at,
        status=AssignmentStatus.completed,
    )


def get_user_assignments_in_cvat_projects(
    session: Session, wallet_address: int, cvat_projects: List[int]
) -> List[Assignment]:
    return (
        session.query(Assignment)
        .where(
            Assignment.job.has(Job.cvat_project_id.in_(cvat_projects))
            & (Assignment.user_wallet_address == wallet_address)
        )
        .all()
    )


# Image
def add_project_images(session: Session, cvat_project_id: int, filenames: List[str]) -> None:
    session.execute(
        insert(Image),
        [
            dict(
                id=str(uuid.uuid4()),
                cvat_project_id=cvat_project_id,
                filename=fn,
            )
            for fn in filenames
        ],
    )


def get_project_images(session: Session, cvat_project_id: int) -> List[Image]:
    return session.query(Image).where(Image.cvat_project_id == cvat_project_id).all()
