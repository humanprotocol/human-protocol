import unittest
import uuid
from src.db import SessionLocal
from src.modules.cvat.constants import JobStatuses, TaskStatuses, ProjectStatuses
from src.modules.cvat.model import Project, Job, Task
from sqlalchemy.exc import IntegrityError
import src.modules.cvat.service as cvat_service


def create_project_and_task(session: SessionLocal) -> tuple:
    cvat_project = Project(
        id=str(uuid.uuid4()), cvat_id=123, status=ProjectStatuses.annotation
    )
    cvat_task = Task(
        id=str(uuid.uuid4()),
        cvat_id=123,
        cvat_project_id=123,
        status=TaskStatuses.annotation,
    )
    session.add(cvat_project)
    session.commit()
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
        project_id = cvat_service.create_project(self.session, cvat_id)

        project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertIsNotNone(project)
        self.assertEqual(project.id, project_id)
        self.assertEqual(project.cvat_id, cvat_id)
        self.assertEqual(project.status, "annotation")

    def test_create_duplicated_project(self):
        cvat_id = 123

        cvat_service.create_project(self.session, cvat_id)
        self.session.commit()

        cvat_service.create_project(self.session, cvat_id)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_project_none_cvat_id(self):
        cvat_service.create_project(self.session, None)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_project_by_id(self):
        p_id = cvat_service.create_project(self.session, 1)

        project = cvat_service.get_project_by_id(self.session, p_id)

        assert project.id == p_id
        assert project.cvat_id == 1
        assert project.status == ProjectStatuses.annotation

        project = cvat_service.get_project_by_id(self.session, "dummy_id")

        assert project == None

    def test_get_projects_by_status(self):
        p_id = cvat_service.create_project(self.session, 1)
        cvat_service.create_project(self.session, 2)
        cvat_service.create_project(self.session, 3)

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.annotation
        )

        assert len(projects) == 3

        cvat_service.update_project_status(
            self.session, p_id, ProjectStatuses.completed
        )

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.annotation
        )

        assert len(projects) == 2

        projects = cvat_service.get_projects_by_status(
            self.session, ProjectStatuses.completed
        )

        assert len(projects) == 1

    def test_update_project_status(self):
        p_id = cvat_service.create_project(self.session, 1)

        cvat_service.update_project_status(
            self.session, p_id, ProjectStatuses.completed
        )

        project = cvat_service.get_project_by_id(self.session, p_id)

        assert project.id == p_id
        assert project.cvat_id == 1
        assert project.status == ProjectStatuses.completed

    def test_update_project_invalid_status(self):
        p_id = cvat_service.create_project(self.session, 1)
        with self.assertRaises(ValueError):
            cvat_service.update_project_status(self.session, p_id, "Invalid Status")

    def test_create_task(self):
        cvat_id = 123
        cvat_service.create_project(self.session, cvat_id)
        cvat_project_id = 123
        status = TaskStatuses.annotation

        task_id = cvat_service.create_task(
            self.session, cvat_id, cvat_project_id, status
        )

        task = self.session.query(Task).filter_by(id=task_id).first()

        self.assertIsNotNone(task)
        self.assertEqual(task.id, task_id)
        self.assertEqual(task.cvat_id, cvat_id)
        self.assertEqual(task.cvat_project_id, cvat_project_id)
        self.assertEqual(task.status, status.value)

    def test_create_task_duplicated_cvat_id(self):
        cvat_id = 123
        cvat_service.create_project(self.session, cvat_id)
        cvat_project_id = 123
        status = TaskStatuses.annotation

        cvat_service.create_task(self.session, cvat_id, cvat_project_id, status)
        self.session.commit()

        cvat_service.create_task(self.session, cvat_id, cvat_project_id, status)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_tas_without_project(self):
        cvat_service.create_task(self.session, 123, 123, TaskStatuses.annotation)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_id(self):
        cvat_service.create_task(self.session, None, 123, TaskStatuses.annotation)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_project_id(self):
        cvat_service.create_task(self.session, 123, None, TaskStatuses.annotation)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_status(self):
        cvat_service.create_task(self.session, 123, 123, None)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_task_by_id(self):
        cvat_service.create_project(self.session, 1)

        task_id = cvat_service.create_task(self.session, 1, 1, TaskStatuses.annotation)
        task = cvat_service.get_task_by_id(self.session, task_id)

        assert task.id == task_id
        assert task.cvat_id == 1
        assert task.cvat_project_id == 1
        assert task.status == TaskStatuses.annotation

        task = cvat_service.get_task_by_id(self.session, "dummy_id")

        assert task == None

    def test_get_tasks_by_status(self):
        cvat_service.create_project(self.session, 1)
        cvat_service.create_task(self.session, 1, 1, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 2, 1, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 3, 1, TaskStatuses.completed)

        tasks = cvat_service.get_tasks_by_status(self.session, TaskStatuses.annotation)

        assert len(tasks) == 2

        tasks = cvat_service.get_tasks_by_status(self.session, TaskStatuses.completed)

        assert len(tasks) == 1

        tasks = cvat_service.get_tasks_by_status(self.session, "Invalid status")

        assert len(tasks) == 0

    def test_update_task_status(self):
        cvat_service.create_project(self.session, 1)
        task_id = cvat_service.create_task(self.session, 1, 1, TaskStatuses.annotation)

        cvat_service.update_task_status(self.session, task_id, TaskStatuses.completed)

        task = cvat_service.get_task_by_id(self.session, task_id)

        assert task.id == task_id
        assert task.cvat_id == 1
        assert task.cvat_project_id == 1
        assert task.status == TaskStatuses.completed

    def test_update_task_invalid_status(self):
        cvat_service.create_project(self.session, 1)
        task_id = cvat_service.create_task(self.session, 1, 1, TaskStatuses.annotation)

        with self.assertRaises(ValueError):
            cvat_service.update_task_status(self.session, task_id, "Invalid status")

    def test_get_tasks_by_cvat_project_id(self):
        cvat_service.create_project(self.session, 1)
        cvat_service.create_task(self.session, 1, 1, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 2, 1, TaskStatuses.annotation)
        cvat_service.create_task(self.session, 3, 1, TaskStatuses.completed)

        cvat_service.create_project(self.session, 2)
        cvat_service.create_task(self.session, 4, 2, TaskStatuses.annotation)

        tasks = cvat_service.get_tasks_by_cvat_project_id(self.session, 1)

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
        status = JobStatuses.new

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
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_without_task(self):
        cvat_project = Project(
            id=str(uuid.uuid4()), cvat_id=123, status=ProjectStatuses.annotation
        )
        self.session.add(cvat_project)
        self.session.commit()

        cvat_service.create_job(
            session=self.session,
            cvat_id=123,
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=None,
            assignee="John Doe",
            status=JobStatuses.new,
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
            status=JobStatuses.new,
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
            status=JobStatuses.new,
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
            status=JobStatuses.new,
        )
        self.session.commit()
        cvat_service.create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_job_by_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        job_id = str(uuid.uuid4())
        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new

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

        assert job == None

    def test_get_job_by_cvat_id(self):
        (cvat_project, cvat_task) = create_project_and_task(self.session)

        cvat_id = 456
        assignee = "John Doe"
        status = JobStatuses.new

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
        status = JobStatuses.new

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
        status = JobStatuses.new

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

        new_status = JobStatuses.completed

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
        status = JobStatuses.new

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
        status = JobStatuses.new

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
        status = JobStatuses.new

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
        status = JobStatuses.new

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
