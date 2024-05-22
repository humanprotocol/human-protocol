import json
import unittest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

import src.services.cvat as cvat_service
from src.core.types import AssignmentStatuses, JobStatuses, PlatformTypes, ProjectStatuses
from src.db import SessionLocal
from src.models.cvat import Assignment, User
from src.schemas import exchange as service_api
from src.services.exchange import (
    create_assignment,
    get_available_tasks,
    get_tasks_by_assignee,
    serialize_task,
)

from tests.utils.db_helper import (
    create_job,
    create_project,
    create_project_task_and_job,
    create_task,
)


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_serialize_task(self):
        cvat_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project = create_project(self.session, escrow_address, cvat_id)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            data = serialize_task(cvat_project.id)

        self.assertEqual(data.id, cvat_project.id)
        self.assertEqual(data.escrow_address, escrow_address)
        self.assertIn("Task ", data.title)
        self.assertTrue(len(data.title.split("Task ")[1]) <= 10)
        self.assertIsInstance(data.description, str)
        self.assertIsInstance(data.job_bounty, str)
        self.assertIsInstance(data.job_time_limit, int)
        self.assertIsInstance(data.job_size, int)
        self.assertEqual(data.job_type, cvat_project.job_type)
        self.assertEqual(data.platform, PlatformTypes.CVAT)
        self.assertEqual(data.status, cvat_project.status)
        self.assertIsNone(data.assignment)
        self.assertIsInstance(data, service_api.TaskResponse)

    def test_serialize_task_with_assignment(self):
        cvat_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"

        cvat_project, _, cvat_job = create_project_task_and_job(
            self.session, escrow_address, cvat_id
        )

        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            data = serialize_task(project_id=cvat_project.id, assignment_id=assignment.id)

        self.assertEqual(data.id, cvat_project.id)
        self.assertEqual(data.escrow_address, escrow_address)
        self.assertIn("Task ", data.title)
        self.assertTrue(len(data.title.split("Task ")[1]) <= 10)
        self.assertIsInstance(data.description, str)
        self.assertIsInstance(data.job_bounty, str)
        self.assertIsInstance(data.job_time_limit, int)
        self.assertIsInstance(data.job_size, int)
        self.assertEqual(data.job_type, cvat_project.job_type)
        self.assertEqual(data.platform, PlatformTypes.CVAT)
        self.assertEqual(data.status, cvat_project.status)
        self.assertIsNotNone(data.assignment)
        self.assertIsInstance(data.assignment.assignment_url, str)
        self.assertEqual(data.assignment.started_at, assignment.created_at)
        self.assertEqual(data.assignment.finishes_at, assignment.expires_at)
        self.assertIsInstance(data, service_api.TaskResponse)

    def test_serialize_task_invalid_project(self):
        with self.assertRaises(AttributeError):
            serialize_task(project_id=str(uuid.uuid4()))

    def test_serialize_task_invalid_manifest(self):
        cvat_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project = create_project(self.session, escrow_address, cvat_id)
        self.session.commit()

        with patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest:
            mock_get_manifest.return_value = None
            with self.assertRaises(ValidationError):
                serialize_task(project_id=cvat_project.id)

    def test_get_available_tasks(self):
        cvat_project_1, _, _ = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_project_2, _, _ = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2
        )
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            tasks = get_available_tasks()

            self.assertEqual(len(tasks), 2)
            self.assertIsInstance(tasks[0], service_api.TaskResponse)
            self.assertIsInstance(tasks[1], service_api.TaskResponse)
            self.assertTrue(any(task.id == cvat_project_1.id for task in tasks))
            self.assertTrue(any(task.id == cvat_project_2.id for task in tasks))

            cvat_service.update_project_status(
                self.session, cvat_project_2.id, ProjectStatuses.completed
            )
            self.session.commit()
            tasks = get_available_tasks()

            self.assertEqual(len(tasks), 1)
            self.assertIsInstance(tasks[0], service_api.TaskResponse)
            self.assertEqual(tasks[0].id, cvat_project_1.id)

    def test_get_tasks_by_assignee(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_project_2, _, cvat_job_2 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2
        )

        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job_1.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            tasks = get_tasks_by_assignee(user_address)

            self.assertEqual(len(tasks), 1)
            self.assertIsInstance(tasks[0], service_api.TaskResponse)
            self.assertEqual(tasks[0].id, cvat_project_1.id)
            self.assertIsNotNone(tasks[0].assignment)

    def test_get_tasks_by_assignee_invalid_address(self):
        tasks = get_tasks_by_assignee("invalid_address")
        self.assertEqual(len(tasks), 0)

    def test_create_assignment(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(cvat_project_1.id, user_address)

            assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

            self.assertEqual(assignment.cvat_job_id, cvat_job_1.cvat_id)
            self.assertEqual(assignment.user_wallet_address, user_address)
            self.assertEqual(assignment.status, AssignmentStatuses.created)

    def test_create_assignment_many_jobs_1_completed(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.completed.value

        cvat_task_2 = create_task(self.session, 2, cvat_project.cvat_id)
        cvat_job_2 = create_job(self.session, 2, cvat_task_2.cvat_id, cvat_project.cvat_id)

        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(hours=1),
            completed_at=now - timedelta(minutes=40),
            expires_at=datetime.now() + timedelta(days=1),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(cvat_project.id, user_address)

        assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

        self.assertEqual(assignment.cvat_job_id, cvat_job_2.cvat_id)
        self.assertEqual(assignment.user_wallet_address, user_address)
        self.assertEqual(assignment.status, AssignmentStatuses.created)

    def test_create_assignment_invalid_user_address(self):
        cvat_project_1, _, _ = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        self.session.commit()

        with self.assertRaises(HTTPException):
            create_assignment(cvat_project_1.id, "invalid_address")

    def test_create_assignment_invalid_project(self):
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)
        self.session.commit()

        with self.assertRaises(HTTPException):
            create_assignment("1", user_address)

    def test_create_assignment_unfinished_assignment(self):
        _, _, cvat_job = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            with self.assertRaises(HTTPException):
                create_assignment("1", user_address)

    def test_create_assignment_no_available_jobs_completed_assignment(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.completed.value

        user_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user1 = User(
            wallet_address=user_address1,
            cvat_email="test1@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        user_address2 = "0x86e83d346041E8806e352681f3F14549C0d2BC70"
        user2 = User(
            wallet_address=user_address2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user2)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address1,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(hours=22),
            expires_at=now + timedelta(hours=2),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(cvat_project.id, user_address2)

        self.assertEqual(assignment_id, None)

    def test_create_assignment_no_available_jobs_active_foreign_assignment(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        user_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user1 = User(
            wallet_address=user_address1,
            cvat_email="test1@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        user_address2 = "0x86e83d346041E8806e352681f3F14549C0d2BC70"
        user2 = User(
            wallet_address=user_address2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user2)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address1,
            cvat_job_id=cvat_job_1.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(cvat_project.id, user_address2)

        self.assertEqual(assignment_id, None)

    def test_create_assignment_in_validated_and_rejected_job(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.new.value  # validated and rejected return to 'new'

        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(hours=1),
            completed_at=now - timedelta(minutes=40),
            expires_at=datetime.now() + timedelta(days=1),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(cvat_project_1.id, user_address)

            assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

        self.assertEqual(assignment.cvat_job_id, cvat_job_1.cvat_id)
        self.assertEqual(assignment.user_wallet_address, user_address)
        self.assertEqual(assignment.status, AssignmentStatuses.created)
