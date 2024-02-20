import json
import unittest
import uuid
from datetime import datetime, timedelta
from io import RawIOBase
from unittest.mock import Mock, patch

from src.core.types import (
    ExchangeOracleEventType,
    JobStatuses,
    Networks,
    ProjectStatuses,
    TaskStatus,
    TaskType,
)
from src.crons.state_trackers import retrieve_annotations
from src.db import SessionLocal
from src.models.cvat import Assignment, Job, Project, Task, User
from src.models.webhook import Webhook


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_retrieve_annotations(self):
        cvat_project_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskType.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatus.completed.value,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.crons.state_trackers.get_escrow_manifest") as mock_get_manifest,
            patch("src.crons.state_trackers.cvat_api"),
            patch("src.crons.state_trackers.validate_escrow"),
            patch("src.crons.state_trackers.cloud_client.S3Client") as mock_S3Client,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            mock_create_file = Mock()
            mock_S3Client.return_value.create_file = mock_create_file

            retrieve_annotations()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost.value)
            .first()
        )
        self.assertIsNotNone(webhook)
        self.assertEqual(webhook.event_type, ExchangeOracleEventType.task_finished)
        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.validation)

    def test_retrieve_annotations_unfinished_jobs(self):
        cvat_project_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskType.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatus.completed.value,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.in_progress,
        )
        self.session.add(cvat_job)
        self.session.commit()

        retrieve_annotations()

        self.session.commit()
        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.annotation)

    @patch("src.cvat.api_calls.get_job_annotations")
    def test_retrieve_annotations_error_getting_annotations(self, mock_annotations):
        cvat_project_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskType.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatus.completed.value,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.crons.state_trackers.get_escrow_manifest") as mock_get_manifest,
            patch("src.crons.state_trackers.cvat_api"),
            patch("src.crons.state_trackers.cvat_api.get_job_annotations") as mock_annotations,
            patch("src.crons.state_trackers.validate_escrow"),
            patch("src.crons.state_trackers.cloud_client.S3Client") as mock_S3Client,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            mock_create_file = Mock()
            mock_S3Client.return_value.create_file = mock_create_file
            mock_annotations.side_effect = Exception("Connection error")

            retrieve_annotations()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost.value)
            .first()
        )
        self.assertIsNone(webhook)

        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.completed.value)

    def test_retrieve_annotations_error_uploading_files(self):
        cvat_project_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskType.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatus.completed.value,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.crons.state_trackers.get_escrow_manifest") as mock_get_manifest,
            patch("src.crons.state_trackers.cvat_api"),
            patch("src.crons.state_trackers.validate_escrow"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            retrieve_annotations()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost.value)
            .first()
        )
        self.assertIsNone(webhook)

        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.completed.value)
