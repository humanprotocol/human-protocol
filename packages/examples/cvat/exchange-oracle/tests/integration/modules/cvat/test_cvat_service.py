import unittest
import uuid
from src.database import SessionLocal

from src.constants import Networks
from src.modules.cvat.constants import (
    JobStatuses,
    TaskStatuses,
    ProjectStatuses,
    JobTypes,
)
from src.modules.cvat.model import Project, Job, Task
from sqlalchemy.exc import IntegrityError
import src.modules.cvat.service as cvat_service


def create_project(session: SessionLocal) -> tuple:
    cvat_project = Project(
        id=str(uuid.uuid4()),
        cvat_id=1,
        cvat_cloudstorage_id=1,
        status=ProjectStatuses.annotation.value,
        job_type=JobTypes.image_label_binary.value,
        escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
        chain_id=Networks.localhost.value,
        bucket_url="https://test.storage.googleapis.com/",
    )
    session.add(cvat_project)
    session.commit()

    return cvat_project


def create_project_and_task(session: SessionLocal) -> tuple:
    cvat_project = Project(
        id=str(uuid.uuid4()),
        cvat_id=1,
        cvat_cloudstorage_id=1,
        status=ProjectStatuses.annotation.value,
        job_type=JobTypes.image_label_binary.value,
        escrow_address="0x86e83d346041E8806e352681f3F14549C0d2BC67",
        chain_id=Networks.localhost.value,
        bucket_url="https://test.storage.googleapis.com/",
    )
    cvat_task = Task(
        id=str(uuid.uuid4()),
        cvat_id=1,
        cvat_project_id=1,
        status=TaskStatuses.annotation.value,
    )
    session.add(cvat_project)
    session.add(cvat_task)
    session.commit()

    return cvat_project, cvat_task


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_project(self):
        cvat_id = 1
        job_type = JobTypes.image_label_binary.value
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

        self.assertIsNotNone(project)
        self.assertEqual(project.id, p_id)
        self.assertEqual(project.cvat_id, cvat_id)
        self.assertEqual(project.status, ProjectStatuses.annotation.value)
        self.assertEqual(project.job_type, job_type)
        self.assertEqual(project.escrow_address, escrow_address)
        self.assertEqual(project.chain_id, chain_id)
        self.assertEqual(project.bucket_url, bucket_url)

    def test_create_duplicated_project(self):
        cvat_id = 1
        job_type = JobTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost.value
        cvat_cloudstorage_id = 1
        bucket_url = "https://test.storage.googleapis.com/"
        project_id = cvat_service.create_project(
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_cvat_id(self):
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_cvat_cloudstorage_id(self):
        cvat_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(IntegrityError):
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_escrow_address(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_chain_id(self):
        cvat_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_bucket_url(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_project_by_id(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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

        project = cvat_service.get_project_by_id(self.session, p_id)

        self.assertIsNotNone(project)
        self.assertEqual(project.id, p_id)
        self.assertEqual(project.cvat_id, cvat_id)
        self.assertEqual(project.status, ProjectStatuses.annotation.value)
        self.assertEqual(project.job_type, job_type)
        self.assertEqual(project.escrow_address, escrow_address)
        self.assertEqual(project.bucket_url, bucket_url)

        project = cvat_service.get_project_by_id(self.session, "dummy_id")

        self.assertIsNone(project)

    def test_get_project_escrow_address(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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

        project = cvat_service.get_project_by_escrow_address(
            self.session, escrow_address
        )

        self.assertIsNotNone(project)
        self.assertEqual(project.id, p_id)
        self.assertEqual(project.cvat_id, cvat_id)
        self.assertEqual(project.status, ProjectStatuses.annotation.value)
        self.assertEqual(project.job_type, job_type)
        self.assertEqual(project.escrow_address, escrow_address)
        self.assertEqual(project.chain_id, chain_id)
        self.assertEqual(project.bucket_url, bucket_url)

        project = cvat_service.get_project_by_escrow_address(
            self.session, "invalid escrow address"
        )

        self.assertIsNone(project)

    def test_get_projects_by_status(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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

        cvat_id = 2
        cvat_cloudstorage_id = 2
        job_type = JobTypes.image_label_binary.value
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
        )

        cvat_id = 3
        cvat_cloudstorage_id = 3
        job_type = JobTypes.image_label_binary.value
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
        )

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.annotation.value
        )

        assert len(projects) == 3

        cvat_service.update_project_status(
            self.session, p_id, ProjectStatuses.completed.value
        )

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.annotation.value
        )

        assert len(projects) == 2

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.completed.value
        )

        assert len(projects) == 1

    def test_update_project_status(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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

        cvat_service.update_project_status(
            self.session, p_id, ProjectStatuses.completed.value
        )

        project = cvat_service.get_project_by_id(self.session, p_id)

        self.assertIsNotNone(project)
        self.assertEqual(project.id, p_id)
        self.assertEqual(project.cvat_id, cvat_id)
        self.assertEqual(project.status, ProjectStatuses.completed.value)
        self.assertEqual(project.job_type, job_type)
        self.assertEqual(project.escrow_address, escrow_address)
        self.assertEqual(project.chain_id, chain_id)
        self.assertEqual(project.bucket_url, bucket_url)

    def test_update_project_invalid_status(self):
        cvat_id = 1
        cvat_cloudstorage_id = 1
        job_type = JobTypes.image_label_binary.value
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
        with self.assertRaises(ValueError):
            cvat_service.update_project_status(self.session, p_id, "Invalid Status")

    def test_create_task(self):
        cvat_project = create_project(self.session)

        cvat_id = 1
        status = TaskStatuses.annotation.value

        task_id = cvat_service.create_task(
            self.session, cvat_id, cvat_project.cvat_id, status
        )

        task = self.session.query(Task).filter_by(id=task_id).first()

        self.assertIsNotNone(task)
        self.assertEqual(task.id, task_id)
        self.assertEqual(task.cvat_id, cvat_id)
        self.assertEqual(task.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(task.status, status)

    def test_create_task_duplicated_cvat_id(self):
        cvat_project = create_project(self.session)

        cvat_id = 1
        status = TaskStatuses.annotation.value

        cvat_service.create_task(self.session, cvat_id, cvat_project.cvat_id, status)
        self.session.commit()

        cvat_service.create_task(self.session, cvat_id, cvat_project.cvat_id, status)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_tas_without_project(self):
        cvat_service.create_task(self.session, 123, 123, TaskStatuses.annotation.value)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_id(self):
        cvat_service.create_task(self.session, None, 123, TaskStatuses.annotation.value)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_project_id(self):
        cvat_service.create_task(self.session, 123, None, TaskStatuses.annotation.value)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_status(self):
        cvat_service.create_task(self.session, 123, 123, None)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_task_by_id(self):
        cvat_project = create_project(self.session)

        task_id = cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation.value
        )
        task = cvat_service.get_task_by_id(self.session, task_id)

        self.assertIsNotNone(task)
        self.assertEqual(task.id, task_id)
        self.assertEqual(task.cvat_id, cvat_project.cvat_id)
        self.assertEqual(task.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(task.status, TaskStatuses.annotation.value)

        task = cvat_service.get_task_by_id(self.session, "dummy_id")

        self.assertIsNone(task)

    def test_get_tasks_by_status(self):
        cvat_project = create_project(self.session)

        cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation.value
        )
        cvat_service.create_task(
            self.session, 2, cvat_project.cvat_id, TaskStatuses.annotation.value
        )
        cvat_service.create_task(
            self.session, 3, cvat_project.cvat_id, TaskStatuses.completed.value
        )

        tasks = cvat_service.get_tasks_by_status(
            self.session, TaskStatuses.annotation.value
        )

        assert len(tasks) == 2

        tasks = cvat_service.get_tasks_by_status(
            self.session, TaskStatuses.completed.value
        )

        assert len(tasks) == 1

        tasks = cvat_service.get_tasks_by_status(self.session, "Invalid status")

        assert len(tasks) == 0

    def test_update_task_status(self):
        cvat_project = create_project(self.session)

        task_id = cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation.value
        )

        cvat_service.update_task_status(
            self.session, task_id, TaskStatuses.completed.value
        )

        task = cvat_service.get_task_by_id(self.session, task_id)

        self.assertIsNotNone(task)
        self.assertEqual(task.id, task_id)
        self.assertEqual(task.cvat_id, cvat_project.cvat_id)
        self.assertEqual(task.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(task.status, TaskStatuses.completed.value)

    def test_update_task_invalid_status(self):
        cvat_project = create_project(self.session)

        task_id = cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation.value
        )

        with self.assertRaises(ValueError):
            cvat_service.update_task_status(self.session, task_id, "Invalid status")

    def test_get_tasks_by_cvat_project_id(self):
        cvat_project = create_project(self.session)

        cvat_service.create_task(
            self.session, 1, cvat_project.cvat_id, TaskStatuses.annotation.value
        )
        cvat_service.create_task(
            self.session, 2, cvat_project.cvat_id, TaskStatuses.annotation.value
        )
        cvat_service.create_task(
            self.session, 3, cvat_project.cvat_id, TaskStatuses.completed.value
        )

        cvat_id = 2
        cvat_cloudstorage_id = 2
        job_type = JobTypes.image_label_binary.value
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        bucket_url = "https://test2.storage.googleapis.com/"
        chain_id = Networks.localhost.value
        project_id = cvat_service.create_project(
            self.session,
            cvat_id,
            cvat_cloudstorage_id,
            job_type,
            escrow_address,
            chain_id,
            bucket_url,
        )

        cvat_service.create_task(self.session, 4, 2, TaskStatuses.annotation.value)

        tasks = cvat_service.get_tasks_by_cvat_project_id(
            self.session, cvat_project.cvat_id
        )

        assert len(tasks) == 3

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, 2)

        assert len(tasks) == 1

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, 123)

        assert len(tasks) == 0

    def test_create_job(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_id = 456
        cvat_task_id = cvat_task.cvat_id
        cvat_project_id = cvat_project.cvat_id
        assignee = "John Doe"
        status = JobStatuses.new.value

        job_id = cvat_service.create_job(
            session=self.session,
            cvat_id=cvat_id,
            cvat_task_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            assignee=assignee,
            status=status,
        )

        job_count = self.session.query(Job).count()
        self.assertEqual(job_count, 1)

        job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task_id)
        self.assertEqual(job.cvat_project_id, cvat_project_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

    def test_create_job_invalid_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=None,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_without_task(self):
        cvat_project = create_project(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=123,
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=None,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_task_reference(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=122,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_project_reference(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=122,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_status(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=123,
            cvat_project_id=123,
            assignee="John Doe",
            status=None,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_duplicated_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        self.session.commit()
        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_job_by_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        job_id = str(uuid.uuid4())
        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)

        job = cvat_service.get_job_by_id(self.session, "Dummy id")

        self.assertIsNone(job)

    def test_get_job_by_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )

        job = cvat_service.get_job_by_cvat_id(self.session, cvat_id)

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)

    def test_get_job_by_cvat_id_wrong_cvat_id(self):
        job = cvat_service.get_job_by_cvat_id(self.session, 457)
        self.assertIsNone(job)

    def test_update_job_assignee(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_id = 456
        assignee = ""
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

        new_assignee = "Harry Doe"

        cvat_service.update_job_assignee(self.session, job.id, new_assignee)

        job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.assignee, new_assignee)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(job.status, status)

    def test_update_job_status(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        job_id = str(uuid.uuid4())
        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

        new_status = JobStatuses.completed.value

        cvat_service.update_job_status(self.session, job.id, new_status)

        job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(job.status, new_status)

    def test_update_job_invalid_status(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        job_id = str(uuid.uuid4())
        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        job_id = cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )
        job = cvat_service.get_job_by_id(self.session, job_id)

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task.cvat_id)
        self.assertEqual(job.cvat_project_id, cvat_project.cvat_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

        with self.assertRaises(ValueError):
            cvat_service.update_job_status(self.session, job.id, "Invalid status")

    def test_get_jobs_by_cvat_task_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new.value

        # Create a job with valid foreign key reference
        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )

        cvat_id = 457
        assignee = "Bob"
        status = JobStatuses.new.value

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )

        cvat_id = 458
        assignee = "Alice"
        status = JobStatuses.new.value

        cvat_service.create_job(
            self.session,
            cvat_id,
            cvat_task.cvat_id,
            cvat_project.cvat_id,
            assignee,
            status,
        )

        jobs = cvat_service.get_jobs_by_cvat_task_id(
            self.session, cvat_task_id=cvat_task.cvat_id
        )

        assert len(jobs) == 3

    def test_delete_project(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)
        cvat_service.create_job(
            session=self.session,
            cvat_id=1,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        cvat_service.create_job(
            session=self.session,
            cvat_id=2,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new.value,
        )
        self.session.commit()

        cvat_project_db = cvat_service.get_project_by_id(self.session, cvat_project.id)
        cvat_task_db = cvat_service.get_task_by_id(self.session, cvat_task.id)
        jobs = cvat_service.get_jobs_by_cvat_task_id(
            self.session, cvat_task_id=cvat_task.cvat_id
        )

        self.assertIsNotNone(cvat_project)
        self.assertEqual(cvat_project_db.id, cvat_project.id)

        self.assertIsNotNone(cvat_task_db)
        self.assertEqual(cvat_task_db.id, cvat_task.id)

        self.assertEqual(len(jobs), 2)

        cvat_service.delete_project(self.session, cvat_project_db.id)

        cvat_project_db = cvat_service.get_project_by_id(self.session, cvat_project.id)
        cvat_task_db = cvat_service.get_task_by_id(self.session, cvat_task.id)
        jobs = cvat_service.get_jobs_by_cvat_task_id(
            self.session, cvat_task_id=cvat_task.cvat_id
        )

        self.assertIsNone(cvat_project_db)
        self.assertIsNone(cvat_task_db)
        self.assertEqual(len(jobs), 0)
