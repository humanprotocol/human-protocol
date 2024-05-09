import itertools
import uuid
from datetime import datetime
from typing import List, Optional, Sequence, Union

from sqlalchemy import delete, insert, update
from sqlalchemy.orm import Session

from src.core.types import AssignmentStatuses, JobStatuses, ProjectStatuses, TaskStatuses, TaskTypes
from src.db.utils import ForUpdateParams
from src.db.utils import maybe_for_update as _maybe_for_update
from src.models.cvat import Assignment, DataUpload, EscrowCreation, Image, Job, Project, Task, User
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
    status: ProjectStatuses = ProjectStatuses.creation,
) -> str:
    """
    Create a project from CVAT.
    """
    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        cvat_id=cvat_id,
        cvat_cloudstorage_id=cvat_cloudstorage_id,
        status=status.value,
        job_type=job_type,
        escrow_address=escrow_address,
        chain_id=chain_id,
        bucket_url=bucket_url,
        cvat_webhook_id=cvat_webhook_id,
    )

    session.add(project)

    return project_id


def get_project_by_id(
    session: Session,
    project_id: str,
    *,
    for_update: Union[bool, ForUpdateParams] = False,
    status_in: Optional[List[ProjectStatuses]] = None,
) -> Optional[Project]:
    if status_in:
        status_filter_arg = [Project.status.in_(s.value for s in status_in)]
    else:
        status_filter_arg = []

    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.id == project_id, *status_filter_arg)
        .first()
    )


def get_projects_by_cvat_ids(
    session: Session,
    project_cvat_ids: Sequence[int],
    *,
    for_update: Union[bool, ForUpdateParams] = False,
    status_in: Optional[List[ProjectStatuses]] = None,
    limit: int = 5,
) -> List[Project]:
    if status_in:
        status_filter_arg = [Project.status.in_(s.value for s in status_in)]
    else:
        status_filter_arg = []

    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.cvat_id.in_(project_cvat_ids), *status_filter_arg)
        .limit(limit)
        .all()
    )


def get_project_by_escrow_address(
    session: Session, escrow_address: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Project]:
    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.escrow_address == escrow_address)
        .first()
    )


def get_projects_by_escrow_address(
    session: Session,
    escrow_address: str,
    *,
    for_update: Union[bool, ForUpdateParams] = False,
    limit: Optional[int] = 5,
) -> List[Project]:
    projects = _maybe_for_update(session.query(Project), enable=for_update).where(
        Project.escrow_address == escrow_address
    )

    if limit is not None:
        projects = projects.limit(limit)

    return projects.all()


def get_project_cvat_ids_by_escrow_address(
    session: Session,
    escrow_address: str,
) -> List[int]:
    projects = session.query(Project).where(Project.escrow_address == escrow_address)

    return list(itertools.chain.from_iterable(projects.values(Project.cvat_id)))


def get_projects_by_status(
    session: Session,
    status: ProjectStatuses,
    *,
    included_types: Optional[Sequence[TaskTypes]] = None,
    limit: int = 5,
    for_update: Union[bool, ForUpdateParams] = False,
) -> List[Project]:
    projects = _maybe_for_update(session.query(Project), enable=for_update).where(
        Project.status == status.value
    )

    if included_types is not None:
        projects = projects.where(Project.job_type.in_([t.value for t in included_types]))

    projects = projects.limit(limit).all()

    return projects


def get_available_projects(
    session: Session, *, limit: int = 10, for_update: Union[bool, ForUpdateParams] = False
) -> List[Project]:
    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(
            (Project.status == ProjectStatuses.annotation.value)
            & Project.jobs.any(
                (Job.status == JobStatuses.new)
                & ~Job.assignments.any(Assignment.status == AssignmentStatuses.created.value)
            )
        )
        .distinct()
        .limit(limit)
        .all()
    )


def get_projects_by_assignee(
    session: Session,
    wallet_address: Optional[str] = None,
    *,
    limit: int = 10,
    for_update: Union[bool, ForUpdateParams] = False,
) -> List[Project]:
    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(
            Project.jobs.any(
                Job.assignments.any(
                    (Assignment.user_wallet_address == wallet_address)
                    & (Assignment.status == AssignmentStatuses.created)
                    & (utcnow() < Assignment.expires_at)
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


def update_project_statuses_by_escrow_address(
    session: Session,
    escrow_address: str,
    chain_id: int,
    status: ProjectStatuses,
) -> None:
    statement = (
        update(Project)
        .where(
            Project.escrow_address == escrow_address,
            Project.chain_id == chain_id,
        )
        .values(status=status.value)
    )
    session.execute(statement)


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


# EscrowCreation
def create_escrow_creation(
    session: Session,
    escrow_address: str,
    chain_id: int,
    total_jobs: int,
) -> str:
    """
    Create an escrow creation tracker
    """

    escrow_creation_id = str(uuid.uuid4())
    escrow_creation = EscrowCreation(
        id=escrow_creation_id,
        escrow_address=escrow_address,
        chain_id=chain_id,
        total_jobs=total_jobs,
    )

    session.add(escrow_creation)

    return escrow_creation_id


def get_escrow_creation_by_id(
    session: Session,
    escrow_creation_id: str,
    *,
    for_update: Union[bool, ForUpdateParams] = False,
) -> Optional[EscrowCreation]:
    return (
        _maybe_for_update(session.query(EscrowCreation), enable=for_update)
        .where(EscrowCreation.id == escrow_creation_id, EscrowCreation.finished_at.is_(None))
        .first()
    )


def get_escrow_creation_by_escrow_address(
    session: Session,
    escrow_address: str,
    chain_id: int,
    *,
    for_update: Union[bool, ForUpdateParams] = False,
) -> Optional[EscrowCreation]:
    return (
        _maybe_for_update(session.query(EscrowCreation), enable=for_update)
        .where(
            EscrowCreation.escrow_address == escrow_address,
            EscrowCreation.chain_id == chain_id,
            EscrowCreation.finished_at.is_(None),
        )
        .first()
    )


def get_active_escrow_creations(
    session: Session, *, limit: int = 10, for_update: Union[bool, ForUpdateParams] = False
) -> List[EscrowCreation]:
    return (
        _maybe_for_update(session.query(EscrowCreation), enable=for_update)
        .where(EscrowCreation.finished_at.is_(None))
        .limit(limit)
        .all()
    )


def finish_escrow_creations(session: Session, escrow_creations: List[EscrowCreation]) -> None:
    statement = (
        update(EscrowCreation)
        .where(EscrowCreation.id.in_(c.id for c in escrow_creations))
        .values(finished_at=utcnow())
    )
    session.execute(statement)


def finish_escrow_creations_by_escrow_address(
    session: Session, escrow_address: str, chain_id: int
) -> None:
    statement = (
        update(EscrowCreation)
        .where(EscrowCreation.escrow_address == escrow_address, EscrowCreation.chain_id == chain_id)
        .values(finished_at=utcnow())
    )
    session.execute(statement)


# Task
def create_task(session: Session, cvat_id: int, cvat_project_id: int, status: TaskStatuses) -> str:
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


def get_task_by_id(
    session: Session, task_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update).where(Task.id == task_id).first()
    )


def get_tasks_by_cvat_id(
    session: Session, task_ids: List[int], *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update)
        .where(Task.cvat_id.in_(task_ids))
        .all()
    )


def get_tasks_by_status(
    session: Session, status: TaskStatuses, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update)
        .where(Task.status == status.value)
        .all()
    )


def update_task_status(session: Session, task_id: int, status: TaskStatuses) -> None:
    upd = update(Task).where(Task.id == task_id).values(status=status.value)
    session.execute(upd)


def get_tasks_by_cvat_project_id(
    session: Session, cvat_project_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update)
        .where(Task.cvat_project_id == cvat_project_id)
        .all()
    )


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


def get_active_task_uploads_by_task_id(
    session: Session, task_ids: List[int], *, for_update: Union[bool, ForUpdateParams] = False
) -> List[DataUpload]:
    return (
        _maybe_for_update(session.query(DataUpload), enable=for_update)
        .where(DataUpload.task_id.in_(task_ids))
        .all()
    )


def get_active_task_uploads(
    session: Session, *, limit: int = 10, for_update: Union[bool, ForUpdateParams] = False
) -> List[DataUpload]:
    return _maybe_for_update(session.query(DataUpload), enable=for_update).limit(limit).all()


def finish_data_uploads(session: Session, uploads: list[DataUpload]) -> None:
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


def get_job_by_id(
    session: Session, job_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Job]:
    return _maybe_for_update(session.query(Job), enable=for_update).where(Job.id == job_id).first()


def get_jobs_by_cvat_id(
    session: Session, cvat_ids: List[int], *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_id.in_(cvat_ids))
        .all()
    )


def update_job_status(session: Session, job_id: int, status: JobStatuses) -> None:
    upd = update(Job).where(Job.id == job_id).values(status=status.value)
    session.execute(upd)


def get_jobs_by_cvat_task_id(
    session: Session, cvat_task_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_task_id == cvat_task_id)
        .all()
    )


def get_jobs_by_cvat_project_id(
    session: Session, cvat_project_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_project_id == cvat_project_id)
        .all()
    )


def count_jobs_by_escrow_address(
    session: Session, escrow_address: str, chain_id: int, status: JobStatuses
) -> int:
    return (
        session.query(Job)
        .where(
            Job.status == status.value,
            Job.project.has(
                (Project.escrow_address == escrow_address) & (Project.chain_id == chain_id)
            ),
        )
        .count()
    )


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


def get_user_by_id(
    session: Session, wallet_address: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[User]:
    return (
        _maybe_for_update(session.query(User), enable=for_update)
        .where(User.wallet_address == wallet_address)
        .first()
    )


def get_user_by_email(
    session: Session, email: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[User]:
    return (
        _maybe_for_update(session.query(User), enable=for_update)
        .where(User.cvat_email == email)
        .first()
    )


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


def get_assignments_by_id(
    session: Session, ids: List[str], *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(Assignment.id.in_(ids))
        .all()
    )


def get_latest_assignment_by_cvat_job_id(
    session: Session, cvat_job_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(Assignment.cvat_job_id == cvat_job_id)
        .order_by(Assignment.created_at.desc())
        .first()
    )


def get_unprocessed_expired_assignments(
    session: Session, *, limit: int = 10, for_update: Union[bool, ForUpdateParams] = False
) -> List[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(
            (Assignment.status == AssignmentStatuses.created.value)
            & (Assignment.completed_at == None)
            & (Assignment.expires_at <= utcnow())
        )
        .limit(limit)
        .all()
    )


def get_active_assignments(
    session: Session, *, limit: int = 10, for_update: Union[bool, ForUpdateParams] = False
) -> List[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(
            (Assignment.status == AssignmentStatuses.created.value)
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
    status: AssignmentStatuses,
    completed_at: Optional[datetime] = None,
):
    statement = (
        update(Assignment)
        .where(Assignment.id == id)
        .values(completed_at=completed_at, status=status.value)
    )
    session.execute(statement)


def cancel_assignment(session: Session, assignment_id: str):
    update_assignment(session, assignment_id, status=AssignmentStatuses.canceled)


def expire_assignment(session: Session, assignment_id: str):
    update_assignment(session, assignment_id, status=AssignmentStatuses.expired)


def complete_assignment(session: Session, assignment_id: str, completed_at: datetime):
    update_assignment(
        session,
        assignment_id,
        completed_at=completed_at,
        status=AssignmentStatuses.completed,
    )


def get_user_assignments_in_cvat_projects(
    session: Session,
    wallet_address: int,
    cvat_projects: List[int],
    *,
    for_update: Union[bool, ForUpdateParams] = False,
) -> List[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
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


def get_project_images(
    session: Session, cvat_project_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[Image]:
    return (
        _maybe_for_update(session.query(Image), enable=for_update)
        .where(Image.cvat_project_id == cvat_project_id)
        .all()
    )
