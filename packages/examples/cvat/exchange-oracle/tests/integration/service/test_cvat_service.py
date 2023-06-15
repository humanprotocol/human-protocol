import unittest
import uuid
from src.db import SessionLocal
from src.modules.cvat.constants import JobStatuses, TaskStatuses
from src.modules.cvat.model import Job, Task
from sqlalchemy.exc import IntegrityError
from src.modules.cvat.service import (
    create_job,
    create_task,
    get_job_by_cvat_id,
    update_job,
)


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_task(self):
        cvat_id = 123
        status = TaskStatuses.annotation

        task_id = create_task(self.session, cvat_id, status)

        task = self.session.query(Task).filter_by(id=task_id).first()

        self.assertIsNotNone(task)
        self.assertEqual(task.id, task_id)
        self.assertEqual(task.cvat_id, cvat_id)
        self.assertEqual(task.status, status.value)

    def test_create_task_duplicated_cvat_id(self):
        cvat_id = 123
        status = TaskStatuses.annotation

        create_task(self.session, cvat_id, status)
        self.session.commit()

        create_task(self.session, cvat_id, status)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_cvat_id(self):
        create_task(self.session, None, TaskStatuses.annotation)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_task_none_status(self):
        create_task(self.session, 123, None)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job(self):
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        self.session.commit()

        cvat_id = 456
        cvat_task_id = cvat_task.cvat_id
        assignee = "John Doe"
        status = JobStatuses.new

        job_id = create_job(
            session=self.session,
            cvat_id=cvat_id,
            cvat_task_id=cvat_task_id,
            assignee=assignee,
            status=status,
        )

        job_count = self.session.query(Job).count()
        self.assertEqual(job_count, 1)

        job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, cvat_task_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

    def test_create_job_invalid_cvat_id(self):
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        self.session.commit()
        create_job(
            session=self.session,
            cvat_id=None,
            cvat_task_id=123,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_without_task(self):
        create_job(
            session=self.session,
            cvat_id=123,
            cvat_task_id=None,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_task_reference(self):
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        self.session.commit()
        create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=122,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_invalid_status(self):
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        self.session.commit()
        create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=123,
            assignee="John Doe",
            status=None,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_job_duplicated_cvat_id(self):
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        cvat_task = Task(
            id=str(uuid.uuid4()), cvat_id=124, status=TaskStatuses.annotation
        )
        self.session.add(cvat_task)
        self.session.commit()
        create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=123,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.commit()
        create_job(
            session=self.session,
            cvat_id=456,
            cvat_task_id=124,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_job_by_cvat_id(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        self.session.commit()

        job_id = str(uuid.uuid4())
        cvat_id = 456
        task_id = task.cvat_id
        assignee = "John Doe"
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_task_id=task_id,
            assignee=assignee,
            status=status,
        )
        self.session.add(job)
        self.session.commit()

        job = get_job_by_cvat_id(self.session, cvat_id)

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, cvat_id)

    def test_get_job_by_cvat_id_wrong_cvat_id(self):
        job = get_job_by_cvat_id(self.session, 457)
        self.assertIsNone(job)

    def test_update_job(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        task2 = Task(id=str(uuid.uuid4()), cvat_id=124, status=TaskStatuses.annotation)
        self.session.add(task2)
        self.session.commit()

        job_id = str(uuid.uuid4())
        cvat_id = 456
        task_id = task.cvat_id
        assignee = "John Doe"
        status = JobStatuses.new

        # Create a job with valid foreign key reference
        job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_task_id=task_id,
            assignee=assignee,
            status=status,
        )
        self.session.add(job)
        self.session.commit()

        self.assertEqual(job.cvat_id, cvat_id)
        self.assertEqual(job.cvat_task_id, task_id)
        self.assertEqual(job.assignee, assignee)
        self.assertEqual(job.status, status)

        new_cvat_id = 457
        new_task_id = task2.cvat_id
        new_asignee = "Harry Doe"
        new_status = JobStatuses.in_progress

        update_job(
            self.session,
            job.id,
            {
                "cvat_id": new_cvat_id,
                "cvat_task_id": new_task_id,
                "assignee": new_asignee,
                "status": new_status,
            },
        )

        job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertIsNotNone(job)
        self.assertEqual(job.id, job_id)
        self.assertEqual(job.cvat_id, new_cvat_id)
        self.assertEqual(job.assignee, new_asignee)
        self.assertEqual(job.cvat_task_id, task2.cvat_id)
        self.assertEqual(job.status, new_status)

    def test_update_job_duplicated_cvat_id(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        task2 = Task(id=str(uuid.uuid4()), cvat_id=124, status=TaskStatuses.annotation)
        self.session.add(task2)
        self.session.commit()

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=456,
            cvat_task_id=task.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job)
        job2 = Job(
            id=str(uuid.uuid4()),
            cvat_id=457,
            cvat_task_id=task2.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job2)
        self.session.commit()

        with self.assertRaises(IntegrityError):
            update_job(self.session, job.id, {"cvat_id": job2.cvat_id})

    def test_update_job_none_cvat_id(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        self.session.commit()

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=456,
            cvat_task_id=task.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job)
        self.session.commit()

        with self.assertRaises(IntegrityError):
            update_job(self.session, job.id, {"cvat_id": None})

    def test_update_job_invalid_cvat_task_id(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        self.session.commit()

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=456,
            cvat_task_id=task.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job)
        self.session.commit()

        with self.assertRaises(IntegrityError):
            update_job(self.session, job.id, {"cvat_task_id": 124})

    def test_update_job_none_cvat_task_id(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        self.session.commit()

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=456,
            cvat_task_id=task.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job)
        self.session.commit()

        with self.assertRaises(IntegrityError):
            update_job(self.session, job.id, {"cvat_task_id": None})

    def test_update_job_none_status(self):
        task = Task(id=str(uuid.uuid4()), cvat_id=123, status=TaskStatuses.annotation)
        self.session.add(task)
        self.session.commit()

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=456,
            cvat_task_id=task.cvat_id,
            assignee="John Doe",
            status=JobStatuses.new,
        )
        self.session.add(job)
        self.session.commit()

        with self.assertRaises(IntegrityError):
            update_job(self.session, job.id, {"status": None})
