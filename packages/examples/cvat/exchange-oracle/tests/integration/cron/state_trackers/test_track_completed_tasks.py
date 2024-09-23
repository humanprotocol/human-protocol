import unittest
import uuid

from sqlalchemy.sql import select

from src.core.types import JobStatuses, Networks, ProjectStatuses, TaskStatuses, TaskTypes
from src.crons.cvat.state_trackers import track_completed_tasks
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_track_completed_tasks(self):
        project = Project(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.annotation.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        track_completed_tasks()

        updated_task = (
            self.session.execute(select(Task).where(Task.id == task_id)).scalars().first()
        )

        assert updated_task.status == TaskStatuses.completed.value

    def test_track_completed_tasks_with_unfinished_job(self):
        project = Project(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.annotation.value,
        )

        job_1 = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
        )
        job_2 = Job(
            id=str(uuid.uuid4()),
            cvat_id=2,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.new.value,
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job_1)
        self.session.add(job_2)
        self.session.commit()

        track_completed_tasks()

        updated_task = (
            self.session.execute(select(Task).where(Task.id == task_id)).scalars().first()
        )

        assert updated_task.status == TaskStatuses.annotation.value
