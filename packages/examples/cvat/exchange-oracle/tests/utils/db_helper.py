import uuid

from sqlalchemy.orm import Session

from src.core.types import JobStatuses, Networks, ProjectStatuses, TaskStatuses, TaskTypes
from src.models.cvat import Job, Project, Task


def create_project(session: Session, escrow_address: str, cvat_id: int) -> tuple:
    cvat_project = Project(
        id=str(uuid.uuid4()),
        cvat_id=cvat_id,
        cvat_cloudstorage_id=1,
        status=ProjectStatuses.annotation.value,
        job_type=TaskTypes.image_label_binary.value,
        escrow_address=escrow_address,
        chain_id=Networks.localhost.value,
        bucket_url="https://test.storage.googleapis.com/",
    )
    session.add(cvat_project)

    return cvat_project


def create_project_and_task(session: Session, escrow_address: str, cvat_id: int) -> tuple:
    cvat_project = create_project(session, escrow_address, cvat_id)
    cvat_task = Task(
        id=str(uuid.uuid4()),
        cvat_id=cvat_id,
        cvat_project_id=cvat_id,
        status=TaskStatuses.annotation.value,
    )
    session.add(cvat_task)

    return cvat_project, cvat_task


def create_project_task_and_job(session: Session, escrow_address: str, cvat_id: int) -> tuple:
    cvat_project, cvat_task = create_project_and_task(session, escrow_address, cvat_id)

    cvat_job = Job(
        id=str(uuid.uuid4()),
        cvat_id=cvat_id,
        cvat_project_id=cvat_id,
        cvat_task_id=cvat_id,
        status=JobStatuses.new,
    )
    session.add(cvat_job)

    return cvat_project, cvat_task, cvat_job
