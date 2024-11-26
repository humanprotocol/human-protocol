"""
Functions in this module are grouped by various categories, look for separators like  `# Job`, etc.
"""

import itertools
import uuid
from collections.abc import Iterable, Sequence
from datetime import datetime
from itertools import islice
from typing import Any, NamedTuple

from sqlalchemy import delete, func, literal, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from src.core.types import (
    AssignmentStatuses,
    EscrowValidationStatuses,
    JobStatuses,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.db import Base, ChildOf
from src.db.utils import ForUpdateParams
from src.db.utils import maybe_for_update as _maybe_for_update
from src.models.cvat import (
    Assignment,
    DataUpload,
    EscrowCreation,
    EscrowValidation,
    Image,
    Job,
    Project,
    Task,
    User,
)
from src.utils.time import utcnow


def batched(iterable: Iterable, *, batch_size: int) -> Iterable[Any]:
    assert batch_size > 0
    iterator = iter(iterable)
    while batch := tuple(islice(iterator, batch_size)):
        yield batch


# Project
def create_project(
    session: Session,
    cvat_id: int,
    cvat_cloudstorage_id: int,
    job_type: str,
    escrow_address: str,
    chain_id: int,
    bucket_url: str,
    cvat_webhook_id: int | None = None,
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
    for_update: bool | ForUpdateParams = False,
    status_in: list[ProjectStatuses] | None = None,
) -> Project | None:
    status_filter_arg = [Project.status.in_(s.value for s in status_in)] if status_in else []

    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.id == project_id, *status_filter_arg)
        .first()
    )


def get_projects_by_cvat_ids(
    session: Session,
    project_cvat_ids: Sequence[int],
    *,
    for_update: bool | ForUpdateParams = False,
    status_in: list[ProjectStatuses] | None = None,
    limit: int = 5,
) -> list[Project]:
    status_filter_arg = [Project.status.in_(s.value for s in status_in)] if status_in else []

    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.cvat_id.in_(project_cvat_ids), *status_filter_arg)
        .limit(limit)
        .all()
    )


def get_project_by_escrow_address(
    session: Session,
    escrow_address: str,
    *,
    for_update: bool | ForUpdateParams = False,
    status_in: list[ProjectStatuses] | None = None,
) -> Project | None:
    status_filter_arg = [Project.status.in_(s.value for s in status_in)] if status_in else []
    return (
        _maybe_for_update(session.query(Project), enable=for_update)
        .where(Project.escrow_address == escrow_address, *status_filter_arg)
        .first()
    )


def get_projects_by_escrow_address(
    session: Session,
    escrow_address: str,
    *,
    for_update: bool | ForUpdateParams = False,
    limit: int | None = 5,
) -> list[Project]:
    projects = _maybe_for_update(session.query(Project), enable=for_update).where(
        Project.escrow_address == escrow_address
    )

    if limit is not None:
        projects = projects.limit(limit)

    return projects.all()


def get_project_cvat_ids_by_escrow_address(
    session: Session,
    escrow_address: str,
) -> list[int]:
    projects = session.query(Project).where(Project.escrow_address == escrow_address)

    return list(itertools.chain.from_iterable(projects.values(Project.cvat_id)))


def get_projects_by_status(
    session: Session,
    status: ProjectStatuses,
    *,
    included_types: Sequence[TaskTypes] | None = None,
    task_status: TaskStatuses | None = None,
    limit: int = 5,
    for_update: bool | ForUpdateParams = False,
) -> list[Project]:
    projects = _maybe_for_update(session.query(Project), enable=for_update).where(
        Project.status == status.value
    )

    if task_status:
        projects = projects.where(Project.tasks.any(Task.status == task_status.value))

    if included_types is not None:
        projects = projects.where(Project.job_type.in_([t.value for t in included_types]))

    return projects.limit(limit).all()


def complete_projects_with_completed_tasks(session: Session) -> list[int]:
    incomplete_tasks_exist = (
        select(1)
        .where(
            Task.cvat_project_id == Project.cvat_id,
            Task.status != TaskStatuses.completed,
        )
        .limit(1)
        .correlate(Project)
    ).exists()

    stmt = (
        update(Project)
        .where(Project.status == ProjectStatuses.annotation, ~incomplete_tasks_exist)
        .values(status=ProjectStatuses.completed)
        .returning(Project.cvat_id)
    )

    result = session.execute(stmt)
    return [row.cvat_id for row in result.all()]


def create_escrow_validations(session: Session, *, limit: int = 100):
    project_counts_per_escrow = (
        select(
            Project.escrow_address,
            Project.chain_id,
            func.count().label("total_projects"),
        )
        .where(Project.status != ProjectStatuses.creation)
        .group_by(Project.escrow_address, Project.chain_id)
    ).subquery()  # TODO: store in escrow creations
    # must not lock and doesn't need a lock (this information is static for created escrows)

    working_set = (
        select(Project.id, Project.escrow_address, Project.chain_id, Project.status)
        .where(Project.status == ProjectStatuses.completed)
        .with_for_update(skip_locked=True)
        .limit(limit) # TODO: might be too small to finish at least 1 escrow
    )  # lock the projects for processing, skip locked + limit to avoid deadlocks and hangs
    # it's not possible to use FOR UPDATE with GROUP BY or HAVING, which we need later

    all_completed_condition = func.count() == project_counts_per_escrow.c["total_projects"]
    completed_projects = (
        select(working_set.c["escrow_address"], working_set.c["chain_id"])
        .select_from(working_set)
        .join(
            project_counts_per_escrow,
            (
                (working_set.c["escrow_address"] == project_counts_per_escrow.c["escrow_address"])
                & (working_set.c["chain_id"] == project_counts_per_escrow.c["chain_id"])
            ),
        )
        .group_by(
            working_set.c["escrow_address"],
            working_set.c["chain_id"],
            project_counts_per_escrow.c["total_projects"],
        )
        .having(all_completed_condition)
    ).subquery()  # compute counts on the locked rows

    completed_projects_for_update = (
        select(working_set.c["id"])
        .select_from(working_set)
        .join(
            completed_projects,
            (
                (working_set.c["escrow_address"] == completed_projects.c["escrow_address"])
                & (working_set.c["chain_id"] == completed_projects.c["chain_id"])
            ),
        )
    )
    completed_projects_for_update_cte = completed_projects_for_update.cte("completed_projects")
    update_stmt = (
        update(Project)
        .where(
            Project.id == completed_projects_for_update_cte.c["id"],
            Project.status == ProjectStatuses.completed,
        )
        .values({"status": ProjectStatuses.validation})
        .returning(Project.escrow_address, Project.chain_id)
    )  # update some of the locked rows

    updated_projects_cte = update_stmt.cte("updated_projects")

    updated_escrows_for_insert = (
        select(
            # literal(func.uuid_generate_v4()).label("id"),
            updated_projects_cte.c["escrow_address"],
            updated_projects_cte.c["chain_id"],
            literal(EscrowValidationStatuses.awaiting).label("status"),
        )
        .select_from(updated_projects_cte)
        .group_by(
            updated_projects_cte.c["escrow_address"],
            updated_projects_cte.c["chain_id"],
        )
    )

    insert_stmt = (
        insert(EscrowValidation)
        .from_select(("escrow_address", "chain_id", "status"), updated_escrows_for_insert)
        .on_conflict_do_update(
            index_elements=("escrow_address", "chain_id"),
            set_={
                "status": EscrowValidationStatuses.awaiting,
            },
            where=EscrowValidation.status != EscrowValidationStatuses.awaiting,
        )
        .returning(EscrowValidation.id, EscrowValidation.escrow_address, EscrowValidation.chain_id)
    )

    return session.execute(insert_stmt).all()


def get_available_projects(session: Session, *, limit: int = 10) -> list[Project]:
    return (
        session.query(Project)
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
    wallet_address: str | None = None,
    *,
    limit: int = 10,
    for_update: bool | ForUpdateParams = False,
) -> list[Project]:
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
    *,
    included_statuses: Sequence[ProjectStatuses] | None = None,
) -> None:
    statement = (
        update(Project)
        .where(
            Project.escrow_address == escrow_address,
            Project.chain_id == chain_id,
            *([Project.status.in_(included_statuses)] if included_statuses else []),
        )
        .values(status=status.value)
        .returning(Project.cvat_id)
    )
    session.execute(statement).all()


def delete_project(session: Session, project_id: str) -> None:
    project = session.query(Project).filter_by(id=project_id).first()
    session.delete(project)


def delete_projects(session: Session, escrow_address: str, chain_id: int) -> None:
    session.execute(
        delete(Project).where(
            Project.escrow_address == escrow_address,
            Project.chain_id == chain_id,
        )
    )


def is_project_completed(session: Session, project_id: str) -> bool:
    project = get_project_by_id(session, project_id)
    jobs = get_jobs_by_cvat_project_id(session, project.cvat_id)
    return bool(len(jobs) > 0 and all(job.status == JobStatuses.completed.value for job in jobs))


# Escrow
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
    for_update: bool | ForUpdateParams = False,
) -> EscrowCreation | None:
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
    for_update: bool | ForUpdateParams = False,
) -> EscrowCreation | None:
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
    session: Session, *, limit: int = 10, for_update: bool | ForUpdateParams = False
) -> list[EscrowCreation]:
    return (
        _maybe_for_update(session.query(EscrowCreation), enable=for_update)
        .where(EscrowCreation.finished_at.is_(None))
        .limit(limit)
        .all()
    )


def finish_escrow_creations(session: Session, escrow_creations: list[EscrowCreation]) -> None:
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


# EscrowValidation


def prepare_escrows_for_validation(
    session: Session, *, limit: int = 5
) -> Sequence[tuple[str, str, int]]:
    subquery = (
        select(EscrowValidation.id)
        .where(EscrowValidation.status == EscrowValidationStatuses.awaiting)
        .limit(limit)
        .order_by(EscrowValidation.attempts.asc())
    )
    update_stmt = (
        update(EscrowValidation)
        .where(EscrowValidation.id.in_(subquery))
        .values(attempts=EscrowValidation.attempts + 1)
        .returning(EscrowValidation.escrow_address, EscrowValidation.chain_id)
    )
    return session.execute(update_stmt).all()


def lock_escrow_for_validation(
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
) -> Sequence[tuple[str, str, int]]:
    stmt = (
        select(EscrowValidation.escrow_address, EscrowValidation.chain_id)
        .where(
            EscrowValidation.escrow_address == escrow_address, EscrowValidation.chain_id == chain_id
        )
        .with_for_update(nowait=True)
    )
    return session.execute(stmt)


def update_escrow_validation(
    session: Session,
    escrow_address: str,
    chain_id: int,
    *,
    status: EscrowValidationStatuses | None = None,
    increase_attempts: bool = False,
) -> None:
    values = {}
    if increase_attempts:
        values["attempts"] = EscrowValidation.attempts + 1
    if status is not None:
        values["status"] = status

    stmt = (
        update(EscrowValidation)
        .where(
            EscrowValidation.escrow_address == escrow_address, EscrowValidation.chain_id == chain_id
        )
        .values(**values)
    )
    session.execute(stmt)


def update_escrow_validation_statuses_by_ids(
    session: Session,
    ids: Iterable[str],
    status: EscrowValidationStatuses,
) -> None:
    stmt = update(EscrowValidation).where(EscrowValidation.id.in_(ids)).values(status=status)
    session.execute(stmt)


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
    session: Session, task_id: str, *, for_update: bool | ForUpdateParams = False
) -> Task | None:
    return (
        _maybe_for_update(session.query(Task), enable=for_update).where(Task.id == task_id).first()
    )


def get_tasks_by_cvat_id(
    session: Session, task_ids: list[int], *, for_update: bool | ForUpdateParams = False
) -> list[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update)
        .where(Task.cvat_id.in_(task_ids))
        .all()
    )


def get_tasks_by_status(
    session: Session,
    status: TaskStatuses,
    *,
    job_status: JobStatuses | None = None,
    project_status: ProjectStatuses | None = None,
    for_update: bool | ForUpdateParams = False,
    limit: int | None = 20,
) -> list[Task]:
    query = _maybe_for_update(session.query(Task), enable=for_update).where(
        Task.status == status.value
    )

    if job_status:
        query = query.where(Task.jobs.any(Job.status == job_status.value))

    if project_status:
        query = query.where(Task.project.has(Project.status == project_status.value))

    if limit:
        query = query.limit(limit)

    return query.all()


def update_task_status(session: Session, task_id: str, status: TaskStatuses) -> None:
    upd = update(Task).where(Task.id == task_id).values(status=status.value)
    session.execute(upd)


def get_tasks_by_cvat_project_id(
    session: Session, cvat_project_id: int, *, for_update: bool | ForUpdateParams = False
) -> list[Task]:
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
    session: Session, task_ids: list[int], *, for_update: bool | ForUpdateParams = False
) -> list[DataUpload]:
    return (
        _maybe_for_update(session.query(DataUpload), enable=for_update)
        .where(DataUpload.task_id.in_(task_ids))
        .all()
    )


def get_active_task_uploads(
    session: Session, *, limit: int = 10, for_update: bool | ForUpdateParams = False
) -> list[DataUpload]:
    return _maybe_for_update(session.query(DataUpload), enable=for_update).limit(limit).all()


def finish_data_uploads(session: Session, uploads: list[DataUpload]) -> None:
    statement = delete(DataUpload).where(DataUpload.id.in_([upload.id for upload in uploads]))
    session.execute(statement)


class TaskResult(NamedTuple):
    id: str
    cvat_id: int


def complete_tasks_with_completed_jobs(session: Session) -> list[TaskResult]:
    incomplete_jobs_exist = (
        select(1)
        .where(Job.cvat_task_id == Task.cvat_id, Job.status != JobStatuses.completed)
        .limit(1)
        .correlate(Task)
    ).exists()

    stmt = (
        update(Task)
        .where(
            Task.status == TaskStatuses.annotation,
            ~incomplete_jobs_exist,
            Task.project.has(Project.status == ProjectStatuses.annotation),
        )
        .values(status=TaskStatuses.completed)
        .returning(Task.id, Task.cvat_id)
    )

    result = session.execute(stmt)
    return [TaskResult(row.id, row.cvat_id) for row in result.all()]


# Job


def create_job(
    session: Session,
    cvat_id: int,
    cvat_task_id: int,
    cvat_project_id: int,
    *,
    start_frame: int,
    stop_frame: int,
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
        start_frame=start_frame,
        stop_frame=stop_frame,
        status=status.value,
    )

    session.add(job)

    return job_id


def get_job_by_id(
    session: Session, job_id: str, *, for_update: bool | ForUpdateParams = False
) -> Job | None:
    return _maybe_for_update(session.query(Job), enable=for_update).where(Job.id == job_id).first()


def get_jobs_by_cvat_id(
    session: Session, cvat_ids: list[int], *, for_update: bool | ForUpdateParams = False
) -> list[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_id.in_(cvat_ids))
        .all()
    )


def update_job_status(session: Session, job_id: str, status: JobStatuses) -> None:
    upd = update(Job).where(Job.id == job_id).values(status=status.value)
    session.execute(upd)


def get_jobs_by_cvat_task_id(
    session: Session, cvat_task_id: int, *, for_update: bool | ForUpdateParams = False
) -> list[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_task_id == cvat_task_id)
        .all()
    )


def get_jobs_by_cvat_project_id(
    session: Session, cvat_project_id: int, *, for_update: bool | ForUpdateParams = False
) -> list[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_project_id == cvat_project_id)
        .all()
    )


def get_jobs_by_escrow_address(
    session: Session,
    escrow_address: str,
    chain_id: int,
    *,
    for_update: bool | ForUpdateParams = False,
) -> list[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(
            Job.project.has(
                (Project.escrow_address == escrow_address) & (Project.chain_id == chain_id)
            )
        )
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


def get_free_job(
    session: Session,
    cvat_projects: list[int],
    *,
    user_wallet_address: str,
    for_update: bool | ForUpdateParams = False,
) -> Job | None:
    """
    Returns the first available job that wasn't previously assigned to that user_walled_address.
    """
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(
            Job.cvat_project_id.in_(cvat_projects),
            Job.status == JobStatuses.new,
            ~Job.assignments.any(
                (
                    (Assignment.status == AssignmentStatuses.created.value)
                    & (Assignment.completed_at == None)
                    & (utcnow() < Assignment.expires_at)
                )
                | (Assignment.user_wallet_address == user_wallet_address),
            ),
        )
        .first()
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
    session: Session, wallet_address: str, *, for_update: bool | ForUpdateParams = False
) -> User | None:
    return (
        _maybe_for_update(session.query(User), enable=for_update)
        .where(User.wallet_address == wallet_address)
        .first()
    )


def get_user_by_email(
    session: Session, email: str, *, for_update: bool | ForUpdateParams = False
) -> User | None:
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
    session: Session, ids: list[str], *, for_update: bool | ForUpdateParams = False
) -> list[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(Assignment.id.in_(ids))
        .all()
    )


def get_latest_assignment_by_cvat_job_id(
    session: Session, cvat_job_id: int, *, for_update: bool | ForUpdateParams = False
) -> Assignment | None:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(Assignment.cvat_job_id == cvat_job_id)
        .order_by(Assignment.created_at.desc())
        .first()
    )


def get_unprocessed_expired_assignments(
    session: Session, *, limit: int = 10, for_update: bool | ForUpdateParams = False
) -> list[Assignment]:
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
    session: Session, *, limit: int = 10, for_update: bool | ForUpdateParams = False
) -> list[Assignment]:
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
    completed_at: datetime | None = None,
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


def reject_assignment(session: Session, assignment_id: str):
    update_assignment(session, assignment_id, status=AssignmentStatuses.rejected)


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
    cvat_projects: list[int],
    *,
    for_update: bool | ForUpdateParams = False,
) -> list[Assignment]:
    return (
        _maybe_for_update(session.query(Assignment), enable=for_update)
        .where(
            Assignment.job.has(Job.cvat_project_id.in_(cvat_projects))
            & (Assignment.user_wallet_address == wallet_address)
        )
        .all()
    )


def count_active_user_assignments(
    session: Session,
    wallet_address: int,
    cvat_projects: list[int],
) -> int:
    return (
        session.query(Assignment)
        .where(
            Assignment.job.has(Job.cvat_project_id.in_(cvat_projects)),
            Assignment.user_wallet_address == wallet_address,
            Assignment.status == AssignmentStatuses.created.value,
            Assignment.completed_at == None,
            utcnow() < Assignment.expires_at,
        )
        .count()
    )


# Image
def add_project_images(session: Session, cvat_project_id: int, filenames: list[str]) -> None:
    session.execute(
        insert(Image),
        [
            {
                "id": str(uuid.uuid4()),
                "cvat_project_id": cvat_project_id,
                "filename": fn,
            }
            for fn in filenames
        ],
    )


def get_project_images(
    session: Session, cvat_project_id: int, *, for_update: bool | ForUpdateParams = False
) -> list[Image]:
    return (
        _maybe_for_update(session.query(Image), enable=for_update)
        .where(Image.cvat_project_id == cvat_project_id)
        .all()
    )


def touch(
    session: Session,
    cls: type["Base"],
    ids: list[str],
    *,
    touch_parents: bool = True,
    time: datetime | None = None,
) -> None:
    if time is None:
        time = utcnow()

    session.execute(update(cls).where(cls.id.in_(ids)).values({cls.updated_at: time}))

    if touch_parents:
        touch_parent_objects(session, cls, ids, time=time)


def touch_parent_objects(
    session: Session,
    cls: type["Base"],
    ids: list[str],
    *,
    time: datetime | None = None,
):
    while issubclass(cls, ChildOf):
        parent_cls = cls.parent_cls
        foreign_key_column = next(iter(cls.parent.property.local_columns))
        parent_id_column = next(iter(foreign_key_column.foreign_keys)).column
        parent_update_stmt = (
            update(parent_cls)
            .where(
                parent_id_column.in_(
                    select(foreign_key_column)
                    .where(cls.id.in_(ids))
                    .where(foreign_key_column.is_not(None))
                )
            )
            .values({parent_cls.updated_at: time})
            .returning(parent_cls.id)
        )
        ids = session.execute(parent_update_stmt).scalars().all()
        cls = parent_cls


def touch_final_assignments(
    session: Session,
    cvat_project_ids: list[int],
    *,
    touch_parents: bool = True,
    time: datetime | None = None,
) -> None:
    if time is None:
        time = utcnow()

    last_assignment_time_per_job_id_subquery = (
        select(
            Assignment.cvat_job_id.label("cvat_job_id"),
            func.max(Assignment.created_at).label("max_created_at"),
        )
        .join(Job)
        .where(
            Assignment.status == AssignmentStatuses.completed,
            Job.cvat_project_id.in_(cvat_project_ids),
        )
        .order_by(Assignment.cvat_job_id)
        .group_by(Assignment.cvat_job_id)
        .subquery()
    )

    last_assignment_ids_query = (
        select(Assignment.id)
        .join(
            last_assignment_time_per_job_id_subquery,
            Assignment.cvat_job_id == last_assignment_time_per_job_id_subquery.c.cvat_job_id,
            isouter=True,
        )
        .where(Assignment.created_at == last_assignment_time_per_job_id_subquery.c.max_created_at)
    )

    ids = session.execute(
        update(Assignment)
        .where(Assignment.id.in_(last_assignment_ids_query))
        .values({Assignment.updated_at: time})
        .returning(Assignment.id)
    )

    if touch_parents:
        touch_parent_objects(session, Assignment, ids.scalars().all(), time=time)
