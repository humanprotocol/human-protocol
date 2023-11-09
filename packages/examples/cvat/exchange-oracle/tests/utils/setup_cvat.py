import hmac
import json
import uuid
from hashlib import sha256

from sqlalchemy.sql import select

from src.core.config import CvatConfig
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task


def generate_cvat_signature(data: dict):
    b_data = json.dumps(data).encode("utf-8")

    signature = (
        "sha256="
        + hmac.new(
            CvatConfig.cvat_webhook_secret.encode("utf-8"),
            b_data,
            digestmod=sha256,
        ).hexdigest()
    )

    return signature


def add_cvat_project_to_db(cvat_id: int) -> str:
    with SessionLocal.begin() as session:
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status="annotation",
            job_type="IMAGE_LABEL_BINARY",
            escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            chain_id=80001,
            bucket_url="https://test.storage.googleapis.com/",
        )

        session.add(project)

    return project_id


def add_cvat_task_to_db(cvat_id: int, cvat_project_id: int, status: str) -> str:
    with SessionLocal.begin() as session:
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project_id,
            status=status,
        )

        session.add(task)

    return task_id


def add_cvat_job_to_db(cvat_id: int, cvat_task_id: int, cvat_project_id: int, status: str) -> str:
    with SessionLocal.begin() as session:
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_task_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=status,
            assignee="",
        )

        session.add(job)

    return job_id


def get_cvat_job_from_db(cvat_id: int) -> dict:
    with SessionLocal.begin() as session:
        session.expire_on_commit = False
        job_query = select(Job).where(Job.cvat_id == cvat_id)
        job = session.execute(job_query).scalars().first()

        return job
