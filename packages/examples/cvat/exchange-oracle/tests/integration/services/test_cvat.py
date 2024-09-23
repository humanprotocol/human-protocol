import unittest
import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import UnmappedInstanceError

import src.services.cvat as cvat_service
from src.core.types import (
    AssignmentStatuses,
    JobStatuses,
    Networks,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.db import SessionLocal
from src.models.cvat import Assignment, DataUpload, Image, Job, Project, Task, User
from src.utils.time import utcnow

from tests.utils.db_helper import (
    create_project,
    create_project_and_task,
    create_project_task_and_job,
)


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_project(self):
        cvat_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        cvat_cloudstorage_id = 1
        bucket_url = "https://test.storage.googleapis.com/"
        p_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )

        project = self.session.query(Project).filter_by(id=p_id).first()

        assert project is not None
        assert project.id == p_id
        assert project.cvat_id == cvat_id
        assert project.status == ProjectStatuses.creation.value
        assert project.job_type == job_type
        assert project.escrow_address == escrow_address
        assert project.chain_id == chain_id
        assert project.bucket_url == bucket_url

    def test_create_duplicated_project(self):
        cvat_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        cvat_cloudstorage_id = 1
        bucket_url = "https://test.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )
        self.session.commit()

        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_cvat_id(self):
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            None,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_cvat_cloudstorage_id(self):
        cvat_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            None,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_job_type(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            None,
            escrow_address,
            chain_id,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_escrow_address(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            None,
            chain_id,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_chain_id(self):
        cvat_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        cvat_cloudstorage_id = 1
        bucket_url = "https://test.storage.googleapis.com/"

        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            None,
            bucket_url,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_project_none_bucket_url(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            None,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_get_project_by_id(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        p_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
            status=ProjectStatuses.annotation,
        )

        project = cvat_service.get_project_by_id(self.session, p_id)

        assert project is not None
        assert project.id == p_id
        assert project.cvat_id == cvat_id
        assert project.status == ProjectStatuses.annotation.value
        assert project.job_type == job_type
        assert project.escrow_address == escrow_address
        assert project.bucket_url == bucket_url

        project = cvat_service.get_project_by_id(self.session, "dummy_id")

        assert project is None

        project = cvat_service.get_project_by_id(
            self.session, p_id, status_in=[ProjectStatuses.annotation]
        )

        assert project is not None
        assert project.id == p_id
        assert project.cvat_id == cvat_id
        assert project.status == ProjectStatuses.annotation.value
        assert project.job_type == job_type
        assert project.escrow_address == escrow_address
        assert project.bucket_url == bucket_url

        project = cvat_service.get_project_by_id(
            self.session, p_id, status_in=[ProjectStatuses.canceled]
        )

        assert project is None

    def test_get_project_by_escrow_address(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        p_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
            status=ProjectStatuses.annotation,
        )

        project = cvat_service.get_project_by_escrow_address(self.session, escrow_address)

        assert project is not None
        assert project.id == p_id
        assert project.cvat_id == cvat_id
        assert project.status == ProjectStatuses.annotation.value
        assert project.job_type == job_type
        assert project.escrow_address == escrow_address
        assert project.chain_id == chain_id
        assert project.bucket_url == bucket_url

        project = cvat_service.get_project_by_escrow_address(self.session, "invalid escrow address")

        assert project is None

    def test_get_projects_by_status(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        p_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
            status=ProjectStatuses.annotation,
        )

        cvat_id = 2
        cvat_cloudstorage_id = 2
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        bucket_url = "https://test2.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
            status=ProjectStatuses.annotation,
        )

        cvat_id = 3
        cvat_cloudstorage_id = 3
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        bucket_url = "https://test3.storage.googleapis.com/"
        cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
            status=ProjectStatuses.annotation,
        )

        projects = cvat_service.get_projects_by_status(self.session, ProjectStatuses.annotation)

        assert len(projects) == 3

        cvat_service.update_project_status(self.session, p_id, ProjectStatuses.completed)

        projects = cvat_service.get_projects_by_status(self.session, ProjectStatuses.annotation)

        assert len(projects) == 2

        projects = cvat_service.get_projects_by_status(self.session, ProjectStatuses.completed)

        assert len(projects) == 1

    def test_get_available_projects(self):
        cvat_id_1 = 456
        (cvat_project, cvat_task, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )

        projects = cvat_service.get_available_projects(self.session)

        assert len(projects) == 1

        cvat_id_2 = 457
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", cvat_id_2
        )

        cvat_task_id = cvat_task.cvat_id
        cvat_project_id = cvat_project.cvat_id

        cvat_service.create_job(
            session=self.session,
            cvat_id=cvat_id_2,
            cvat_task_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=JobStatuses.in_progress,
        )

        cvat_id_3 = 458
        (cvat_project, cvat_task, _) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC69", cvat_id_3
        )

        projects = cvat_service.get_available_projects(self.session)
        assert len(projects) == 2
        assert any(project.cvat_id == cvat_id_1 for project in projects)
        assert any(project.cvat_id == cvat_id_3 for project in projects)

    def test_get_projects_by_assignee(self):
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC60"
        cvat_id_1 = 456

        create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )

        user = User(wallet_address=wallet_address_1, cvat_id=cvat_id_1, cvat_email="test@hmt.ai")
        self.session.add(user)

        cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address_1,
            cvat_job_id=cvat_id_1,
            expires_at=datetime.now() + timedelta(days=1),
        )

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC61"
        cvat_id_2 = 457

        create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", cvat_id_2
        )

        user = User(wallet_address=wallet_address_2, cvat_id=cvat_id_2, cvat_email="test2@hmt.ai")
        self.session.add(user)

        cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address_2,
            cvat_job_id=cvat_id_2,
            expires_at=utcnow(),
        )

        projects = cvat_service.get_projects_by_assignee(self.session, wallet_address_1)

        assert len(projects) == 1
        assert projects[0].cvat_id == cvat_id_1

        projects = cvat_service.get_projects_by_assignee(self.session, wallet_address_2)

        assert (
            len(projects) == 0
        )  # expired should not be shown, https://github.com/humanprotocol/human-protocol/pull/1879

    def test_update_project_status(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = TaskTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        bucket_url = "https://test.storage.googleapis.com/"
        p_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )

        cvat_service.update_project_status(self.session, p_id, ProjectStatuses.completed)

        project = cvat_service.get_project_by_id(self.session, p_id)

        assert project is not None
        assert project.id == p_id
        assert project.cvat_id == cvat_id
        assert project.status == ProjectStatuses.completed.value
        assert project.job_type == job_type
        assert project.escrow_address == escrow_address
        assert project.chain_id == chain_id
        assert project.bucket_url == bucket_url

    def test_delete_project(self):
        cvat_id_1 = 456

        project = create_project(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )

        projects = self.session.query(Project).all()
        assert len(projects) == 1

        cvat_service.delete_project(self.session, project.id)

        projects = self.session.query(Project).all()
        assert len(projects) == 0

        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )
        cvat_service.create_job(
            session=self.session,
            cvat_id=1,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        cvat_service.create_job(
            session=self.session,
            cvat_id=2,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        self.session.commit()

        cvat_project_db = cvat_service.get_project_by_id(self.session, cvat_project.id)
        cvat_task_db = cvat_service.get_task_by_id(self.session, cvat_task.id)
        jobs = cvat_service.get_jobs_by_cvat_task_id(self.session, cvat_task_id=cvat_task.cvat_id)

        assert cvat_project is not None
        assert cvat_project_db.id == cvat_project.id

        assert cvat_task_db is not None
        assert cvat_task_db.id == cvat_task.id

        assert len(jobs) == 2

        cvat_service.delete_project(self.session, cvat_project_db.id)

        cvat_project_db = cvat_service.get_project_by_id(self.session, cvat_project.id)
        cvat_task_db = cvat_service.get_task_by_id(self.session, cvat_task.id)
        jobs = cvat_service.get_jobs_by_cvat_task_id(self.session, cvat_task_id=cvat_task.cvat_id)

        assert cvat_project_db is None
        assert cvat_task_db is None
        assert len(jobs) == 0

    def test_delete_project_wrong_project_id(self):
        cvat_id = 456

        create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id)

        projects = self.session.query(Project).all()
        assert len(projects) == 1
        with pytest.raises(UnmappedInstanceError):
            cvat_service.delete_project(self.session, "project_id")

    def test_create_task(self):
        cvat_id = 1
        cvat_project = create_project(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id
        )

        status = TaskStatuses.annotation

        task_id = cvat_service.create_task(self.session, cvat_id, cvat_project.cvat_id, status)

        task = self.session.query(Task).filter_by(id=task_id).first()

        assert task is not None
        assert task.id == task_id
        assert task.cvat_id == cvat_id
        assert task.cvat_project_id == cvat_project.cvat_id
        assert task.status == status

    def test_create_task_duplicated_cvat_id(self):
        cvat_id = 1
        cvat_project = create_project(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id
        )

        status = TaskStatuses.annotation

        cvat_service.create_task(self.session, cvat_id, cvat_project.cvat_id, status)
        self.session.commit()

        cvat_service.create_task(self.session, cvat_id, cvat_project.cvat_id, status)
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_tas_without_project(self):
        cvat_service.create_task(self.session, 123, 123, TaskStatuses.annotation)
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_id(self):
        cvat_service.create_task(self.session, None, 123, TaskStatuses.annotation)
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_project_id(self):
        cvat_service.create_task(self.session, 123, None, TaskStatuses.annotation)
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_get_task_by_id(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        task_id = cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation
        )
        task = cvat_service.get_task_by_id(self.session, task_id)

        assert task is not None
        assert task.id == task_id
        assert task.cvat_id == cvat_project.cvat_id
        assert task.cvat_project_id == cvat_project.cvat_id
        assert task.status == TaskStatuses.annotation.value

        task = cvat_service.get_task_by_id(self.session, "dummy_id")

        assert task is None

    def test_get_tasks_by_cvat_id(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        cvat_service.create_task(self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 2, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 3, cvat_project.cvat_id, TaskStatuses.annotation)

        tasks = cvat_service.get_tasks_by_cvat_id(self.session, [1, 2])

        assert len(tasks) == 2

        tasks = cvat_service.get_tasks_by_cvat_id(self.session, [3])

        assert len(tasks) == 1

        tasks = cvat_service.get_tasks_by_cvat_id(self.session, [999])

        assert len(tasks) == 0

    def test_get_tasks_by_status(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        cvat_service.create_task(self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 2, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 3, cvat_project.cvat_id, TaskStatuses.completed)

        tasks = cvat_service.get_tasks_by_status(self.session, TaskStatuses.annotation)

        assert len(tasks) == 2

        tasks = cvat_service.get_tasks_by_status(self.session, TaskStatuses.completed)

        assert len(tasks) == 1

    def test_update_task_status(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        task_id = cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation
        )

        cvat_service.update_task_status(self.session, task_id, TaskStatuses.completed)

        task = cvat_service.get_task_by_id(self.session, task_id)

        assert task is not None
        assert task.id == task_id
        assert task.cvat_id == cvat_project.cvat_id
        assert task.cvat_project_id == cvat_project.cvat_id
        assert task.status == TaskStatuses.completed.value

    def test_get_tasks_by_cvat_project_id(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        cvat_service.create_task(self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 2, cvat_project.cvat_id, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 3, cvat_project.cvat_id, TaskStatuses.completed)

        cvat_project_2 = create_project(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2
        )

        cvat_service.create_task(self.session, 4, cvat_project_2.cvat_id, TaskStatuses.annotation)

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, cvat_project.cvat_id)

        assert len(tasks) == 3

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, cvat_project_2.cvat_id)

        assert len(tasks) == 1

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, 123)

        assert len(tasks) == 0

    def test_create_data_upload(self):
        cvat_id = 1
        (_, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id
        )

        data_upload_id = cvat_service.create_data_upload(self.session, cvat_task.cvat_id)

        data_upload = self.session.query(DataUpload).filter_by(task_id=cvat_task.cvat_id).first()

        assert data_upload is not None
        assert data_upload.id == data_upload_id
        assert data_upload.task_id == cvat_id

    def test_get_active_task_uploads_by_task_id(self):
        cvat_id_1 = 1
        (_, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )
        cvat_id_2 = 2
        (_, cvat_task_2) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", cvat_id_2
        )

        cvat_service.create_data_upload(self.session, cvat_task.cvat_id)
        cvat_service.create_data_upload(self.session, cvat_task_2.cvat_id)

        data_uploads = cvat_service.get_active_task_uploads_by_task_id(
            self.session, [cvat_id_1, cvat_id_2]
        )
        assert len(data_uploads) == 2

        data_uploads = cvat_service.get_active_task_uploads_by_task_id(self.session, [cvat_id_1])
        assert len(data_uploads) == 1

        data_uploads = cvat_service.get_active_task_uploads_by_task_id(self.session, [cvat_id_2])
        assert len(data_uploads) == 1

        data_uploads = cvat_service.get_active_task_uploads_by_task_id(self.session, [])
        assert len(data_uploads) == 0

    def test_get_active_task_uploads(self):
        cvat_id_1 = 1
        (_, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )
        cvat_id_2 = 2
        (_, cvat_task_2) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", cvat_id_2
        )

        cvat_service.create_data_upload(self.session, cvat_task.cvat_id)
        cvat_service.create_data_upload(self.session, cvat_task_2.cvat_id)

        data_uploads = cvat_service.get_active_task_uploads(self.session)
        assert len(data_uploads) == 2

        data_uploads = cvat_service.get_active_task_uploads(self.session, limit=1)
        assert len(data_uploads) == 1

    def test_get_active_task_uploads(self):
        cvat_id_1 = 1
        (_, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", cvat_id_1
        )
        cvat_id_2 = 2
        (_, cvat_task_2) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", cvat_id_2
        )

        cvat_service.create_data_upload(self.session, cvat_task.cvat_id)
        cvat_service.create_data_upload(self.session, cvat_task_2.cvat_id)

        data_uploads = self.session.query(DataUpload).all()
        assert len(data_uploads) == 2

        cvat_service.finish_data_uploads(self.session, [data_uploads[0]])

        data_uploads = self.session.query(DataUpload).all()
        assert len(data_uploads) == 1

        cvat_service.finish_data_uploads(self.session, [data_uploads[0]])

        data_uploads = self.session.query(DataUpload).all()
        assert len(data_uploads) == 0

    def test_create_job(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_task_id = cvat_task.cvat_id
        cvat_job_id = 456
        cvat_project_id = cvat_project.cvat_id
        status = JobStatuses.new

        job_id = cvat_service.create_job(
            session=self.session,
            cvat_id=cvat_job_id,
            cvat_task_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=status,
        )

        job_count = self.session.query(Job).count()
        assert job_count == 1

        job = self.session.query(Job).filter_by(id=job_id).first()

        assert job.cvat_id == cvat_job_id
        assert job.cvat_task_id == cvat_task_id
        assert job.cvat_project_id == cvat_project_id
        assert job.status == status

    def test_create_job_invalid_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_service.create_job(
            session=self.session,
            cvat_id=None,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_job_without_task(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        cvat_service.create_job(
            session=self.session,
            cvat_id=123,
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=None,
            status=JobStatuses.new,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_task_reference(self):
        (cvat_project, _) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=122,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_project_reference(self):
        (_, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=122,
            status=JobStatuses.new,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_job_duplicated_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        self.session.commit()
        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=JobStatuses.new,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_get_job_by_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        job_id = str(uuid.uuid4())
        cvat_id = 456
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        assert job is not None
        assert job.id == job_id
        assert job.cvat_id == cvat_id
        assert job.cvat_task_id == cvat_task.cvat_id
        assert job.cvat_project_id == cvat_project.cvat_id

        job = cvat_service.get_job_by_id(self.session, "Dummy id")

        assert job is None

    def test_get_jobs_by_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_id = 456
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        jobs = cvat_service.get_jobs_by_cvat_id(self.session, [cvat_id])

        assert jobs is not None
        assert jobs[0].id == job_id
        assert jobs[0].cvat_id == cvat_id
        assert jobs[0].cvat_task_id == cvat_task.cvat_id
        assert jobs[0].cvat_project_id == cvat_project.cvat_id

    def test_get_jobs_by_cvat_id_wrong_cvat_id(self):
        job = cvat_service.get_jobs_by_cvat_id(self.session, [457])
        assert job == []

    def test_update_job_status(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        job_id = str(uuid.uuid4())
        cvat_id = 456
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        assert job.cvat_id == cvat_id
        assert job.cvat_task_id == cvat_task.cvat_id
        assert job.cvat_project_id == cvat_project.cvat_id
        assert job.status == status

        new_status = JobStatuses.completed

        cvat_service.update_job_status(self.session, job.id, new_status)

        job = self.session.query(Job).filter_by(id=job_id).first()

        assert job is not None
        assert job.id == job_id
        assert job.cvat_id == cvat_id
        assert job.cvat_task_id == cvat_task.cvat_id
        assert job.cvat_project_id == cvat_project.cvat_id
        assert job.status == new_status

    def test_get_jobs_by_cvat_task_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_id = 456
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        cvat_id = 457
        status = JobStatuses.new

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        cvat_id = 458
        status = JobStatuses.new

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        jobs = cvat_service.get_jobs_by_cvat_task_id(self.session, cvat_task_id=cvat_task.cvat_id)

        assert len(jobs) == 3

    def test_get_jobs_by_cvat_project_id(self):
        (cvat_project, cvat_task) = create_project_and_task(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_id = 456
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        cvat_id = 457
        status = JobStatuses.new

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        cvat_id = 458
        status = JobStatuses.new

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            status,
        )

        jobs = cvat_service.get_jobs_by_cvat_project_id(self.session, cvat_project.cvat_id)

        assert len(jobs) == 3

    def test_put_user(self):
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        cvat_email = "test@hmt.ai"
        cvat_id = 1
        user = cvat_service.put_user(
            self.session,
            wallet_address,
            cvat_email,
            cvat_id,
        )

        db_user = self.session.query(User).filter_by(cvat_id=cvat_id).first()

        assert user is not None
        assert user == db_user
        assert user.id == db_user.id
        assert user.cvat_id == cvat_id
        assert user.cvat_email == cvat_email
        assert user.wallet_address == wallet_address

    def test_put_user(self):
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        cvat_email = "test@hmt.ai"
        cvat_id = 1
        user = cvat_service.put_user(
            self.session,
            wallet_address,
            cvat_email,
            cvat_id,
        )

        db_user = self.session.query(User).filter_by(cvat_id=cvat_id).first()

        assert user is not None
        assert user.cvat_id == cvat_id
        assert user.cvat_email == cvat_email
        assert user.wallet_address == wallet_address
        assert db_user.cvat_id == cvat_id
        assert db_user.cvat_email == cvat_email
        assert db_user.wallet_address == wallet_address

    def test_put_user_duplicated_address(self):
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        cvat_service.put_user(
            self.session,
            wallet_address,
            "test@hmt.ai",
            1,
        )
        self.session.commit()

        db_users = self.session.query(User).filter_by(wallet_address=wallet_address).all()
        assert len(db_users) == 1
        assert db_users[0].cvat_id == 1
        assert db_users[0].cvat_email == "test@hmt.ai"

        cvat_service.put_user(
            self.session,
            wallet_address,
            "test2@hmt.ai",
            2,
        )
        self.session.commit()

        db_users = self.session.query(User).filter_by(wallet_address=wallet_address).all()
        assert len(db_users) == 1
        assert db_users[0].cvat_id == 2
        assert db_users[0].cvat_email == "test2@hmt.ai"

    def test_put_user_duplicated_email(self):
        email = "test@hmt.ai"
        cvat_service.put_user(
            self.session,
            "0x86e83d346041E8806e352681f3F14549C0d2BC67",
            email,
            1,
        )

        cvat_service.put_user(
            self.session,
            "0x86e83d346041E8806e352681f3F14549C0d2BC68",
            email,
            2,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_put_user_duplicated_id(self):
        cvat_id = 1
        cvat_service.put_user(
            self.session,
            "0x86e83d346041E8806e352681f3F14549C0d2BC67",
            "test@hmt.ai",
            cvat_id,
        )

        cvat_service.put_user(
            self.session,
            "0x86e83d346041E8806e352681f3F14549C0d2BC68",
            "test2@hmt.ai",
            cvat_id,
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_get_user_by_id(self):
        user = User(
            wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        user = User(
            wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC68",
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        self.session.commit()

        user_1 = cvat_service.get_user_by_id(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        )
        assert user_1.cvat_id == 1
        assert user_1.cvat_email == "test@hmt.ai"

        user_2 = cvat_service.get_user_by_id(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        )
        assert user_2.cvat_id == 2
        assert user_2.cvat_email == "test2@hmt.ai"

        user_3 = cvat_service.get_user_by_id(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        )
        assert user_3 is None

    def test_create_assignment(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment_id = cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )

        assignment_count = self.session.query(Assignment).count()
        assert assignment_count == 1

        assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

        assert assignment is not None
        assert assignment.user_wallet_address == wallet_address
        assert assignment.cvat_job_id == cvat_job.cvat_id
        assert assignment.status == AssignmentStatuses.created.value

    def test_create_assignment_invalid_address(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        cvat_service.create_assignment(
            session=self.session,
            wallet_address="invalid_address",
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_create_assignment_invalid_address(self):
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address,
            cvat_job_id=0,
            expires_at=datetime.now(),
        )
        with pytest.raises(IntegrityError):
            self.session.commit()

    def test_get_assignments_by_id(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        assignment_2 = cvat_service.create_assignment(
            session=self.session,
            wallet_address=wallet_address_2,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        self.session.commit()

        assignments = cvat_service.get_assignments_by_id(self.session, [assignment, assignment_2])
        assert len(assignments) == 2

        assignments = cvat_service.get_assignments_by_id(self.session, [assignment])
        assert len(assignments) == 1
        assert assignments[0].id == assignment
        assert assignments[0].user_wallet_address == wallet_address_1

        assignments = cvat_service.get_assignments_by_id(self.session, [assignment_2])
        assert len(assignments) == 1
        assert assignments[0].id == assignment_2
        assert assignments[0].user_wallet_address == wallet_address_2

    def test_get_latest_assignment_by_cvat_job_id(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
            created_at=datetime.now() - timedelta(days=1),
        )
        assignment_2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_2,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        self.session.add(assignment)
        self.session.add(assignment_2)
        self.session.commit()

        received_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
            self.session, cvat_job.cvat_id
        )
        assert received_assignment.id == assignment_2.id
        assert received_assignment.id != assignment.id
        assert received_assignment.user_wallet_address == wallet_address_2

    def test_get_unprocessed_expired_assignments(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        assignment_2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_2,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() - timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.add(assignment_2)
        self.session.commit()

        assignments = cvat_service.get_unprocessed_expired_assignments(self.session)
        assert len(assignments) == 1
        assert assignments[0].id == assignment_2.id
        assert assignments[0].id != assignment.id
        assert assignments[0].user_wallet_address == wallet_address_2

    def test_update_assignment(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        cvat_service.update_assignment(
            self.session, assignment.id, status=AssignmentStatuses.completed
        )

        db_assignment = self.session.query(Assignment).filter_by(id=assignment.id).first()

        assert db_assignment.id == assignment.id
        assert db_assignment.status == AssignmentStatuses.completed

    def test_cancel_assignment(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        cvat_service.cancel_assignment(self.session, assignment.id)

        db_assignment = self.session.query(Assignment).filter_by(id=assignment.id).first()

        assert db_assignment.id == assignment.id
        assert db_assignment.status == AssignmentStatuses.canceled

    def test_expire_assignment(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        cvat_service.expire_assignment(self.session, assignment.id)

        db_assignment = self.session.query(Assignment).filter_by(id=assignment.id).first()

        assert db_assignment.id == assignment.id
        assert db_assignment.status == AssignmentStatuses.expired

    def test_complete_assignment(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()
        completed_date = datetime.now() + timedelta(days=1)
        cvat_service.complete_assignment(self.session, assignment.id, completed_date)

        db_assignment = self.session.query(Assignment).filter_by(id=assignment.id).first()

        assert db_assignment.id == assignment.id
        assert db_assignment.status == AssignmentStatuses.completed
        assert db_assignment.completed_at == completed_date

    def test_test_add_project_images(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        assignment_2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_2,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now(),
        )
        self.session.add(assignment)
        self.session.add(assignment_2)
        self.session.commit()

        assignments = cvat_service.get_user_assignments_in_cvat_projects(
            self.session, wallet_address_1, [cvat_job.cvat_id]
        )
        assert len(assignments) == 1
        assert assignments[0].id == assignment.id
        assert assignments[0].id != assignment_2.id
        assert assignments[0].user_wallet_address == wallet_address_1

    def test_add_project_images(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        filenames = [
            "image1.jpg",
            "image2.jpg",
        ]
        cvat_service.add_project_images(
            self.session, cvat_project_id=cvat_project.cvat_id, filenames=filenames
        )

        images = (
            self.session.query(Image).where(Image.cvat_project_id == cvat_project.cvat_id).all()
        )

        assert len(images) == 2
        assert images[0].filename == filenames[0]
        assert images[1].filename == filenames[1]

    def test_add_project_images_wrong_project_id(self):
        filenames = [
            "image1.jpg",
            "image2.jpg",
        ]
        with pytest.raises(IntegrityError):
            cvat_service.add_project_images(self.session, cvat_project_id=1, filenames=filenames)

    def test_add_project_images(self):
        cvat_project = create_project(self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1)

        filenames = [
            "image1.jpg",
            "image2.jpg",
        ]
        image_1 = Image(
            id=str(uuid.uuid4()), cvat_project_id=cvat_project.cvat_id, filename=filenames[0]
        )
        image_2 = Image(
            id=str(uuid.uuid4()), cvat_project_id=cvat_project.cvat_id, filename=filenames[1]
        )

        self.session.add(image_1)
        self.session.add(image_2)
        self.session.commit()

        images = cvat_service.get_project_images(self.session, cvat_project.cvat_id)

        assert len(images) == 2
        assert images[0].filename == filenames[0]
        assert images[1].filename == filenames[1]

        images = cvat_service.get_project_images(self.session, 2)

        assert len(images) == 0
