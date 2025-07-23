import hmac
import json
import uuid
from collections.abc import Generator, Sequence
from contextlib import ExitStack, contextmanager
from datetime import datetime
from hashlib import sha256

from sqlalchemy.orm import Session
from sqlalchemy.sql import select

from src.core.config import CvatConfig
from src.core.types import AssignmentStatuses, JobStatuses, ProjectStatuses, TaskStatuses, TaskTypes
from src.db import SessionLocal
from src.models.cvat import Assignment, Job, Project, Task, User

from tests.utils.constants import ESCROW_ADDRESS


def generate_cvat_signature(data: dict):
    b_data = json.dumps(data).encode("utf-8")

    return (
        "sha256="
        + hmac.new(
            CvatConfig.webhook_secret.encode("utf-8"),
            b_data,
            digestmod=sha256,
        ).hexdigest()
    )


def add_cvat_project_to_db(cvat_id: int, *, session: Session | None = None) -> Project:
    with get_session(session) as session_:
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation,
            job_type=TaskTypes.image_label_binary,
            escrow_address=ESCROW_ADDRESS,
            chain_id=80002,
            bucket_url="https://test.storage.googleapis.com/",
        )

        session_.add(project)

    return project


def add_cvat_task_to_db(
    cvat_id: int,
    cvat_project_id: int,
    *,
    status: TaskStatuses | str = TaskStatuses.annotation,
    session: Session | None = None,
) -> Task:
    with get_session(session) as session_:
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatuses(status) if not isinstance(status, TaskStatuses) else status,
        )

        session_.add(task)

    return task


def add_cvat_job_to_db(
    cvat_id: int,
    cvat_task_id: int,
    cvat_project_id: int,
    *,
    status: JobStatuses | str = JobStatuses.new,
    session: Session | None = None,
) -> Job:
    with get_session(session) as session_:
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_task_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=JobStatuses(status) if not isinstance(status, JobStatuses) else status,
            start_frame=0,
            stop_frame=1,
        )

        session_.add(job)

    return job


def add_assignment_to_db(
    wallet_address: str,
    cvat_id: int,
    cvat_job_id: int,
    expires_at: datetime,
    *,
    status: AssignmentStatuses | str = AssignmentStatuses.created,
    session: Session | None = None,
) -> Assignment:
    with get_session(session) as session_:
        user = User(
            wallet_address=wallet_address,
            cvat_email="test" + str(cvat_id) + "@hmt.ai",
            cvat_id=cvat_id,
        )
        session_.add(user)
        assignment_id = str(uuid.uuid4())
        assignment = Assignment(
            id=assignment_id,
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job_id,
            expires_at=expires_at,
            status=AssignmentStatuses(status)
            if not isinstance(status, AssignmentStatuses)
            else status,
        )

        session_.add(assignment)

    return assignment


def get_cvat_job_from_db(
    cvat_id: int, *, session: Session | None = None
) -> tuple[Job, Sequence[Assignment]]:
    with get_session(session) as session_:
        job_query = select(Job).where(Job.cvat_id == cvat_id)
        job = session_.execute(job_query).scalars().first()

        assignments_query = select(Assignment).where(Assignment.cvat_job_id == cvat_id)
        assignments = session_.execute(assignments_query).scalars().all()

        return job, assignments


@contextmanager
def get_session(session: Session | None = None) -> Generator[Session, None, None]:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())
            session.expire_on_commit = False

        yield session
