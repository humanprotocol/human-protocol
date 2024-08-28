import unittest
import uuid

from sqlalchemy.sql import select

from src.core.types import Networks, ProjectStatuses, TaskStatuses, TaskTypes
from src.crons.cvat.state_trackers import track_completed_projects
from src.db import SessionLocal
from src.models.cvat import Project, Task


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_track_completed_projects(self):
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        self.session.add(project)
        self.session.add(task)
        self.session.commit()

        track_completed_projects()

        updated_project = (
            self.session.execute(select(Project).where(Project.id == project_id)).scalars().first()
        )

        assert updated_project.status == ProjectStatuses.completed.value

    def test_track_completed_projects_with_unfinished_task(self):
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task_1 = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )
        task_2 = Task(
            id=str(uuid.uuid4()),
            cvat_id=2,
            cvat_project_id=1,
            status=TaskStatuses.annotation.value,
        )

        self.session.add(project)
        self.session.add(task_1)
        self.session.add(task_2)
        self.session.commit()

        track_completed_projects()

        updated_project = (
            self.session.execute(select(Project).where(Project.id == project_id)).scalars().first()
        )

        assert updated_project.status == ProjectStatuses.annotation.value
