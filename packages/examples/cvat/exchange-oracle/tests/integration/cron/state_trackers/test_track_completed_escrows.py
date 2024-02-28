import io
import json
import os
import unittest
import uuid
import zipfile
from datetime import datetime, timedelta
from glob import glob
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

import datumaro as dm

from src.core.types import (
    ExchangeOracleEventTypes,
    JobStatuses,
    Networks,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.crons.state_trackers import track_completed_escrows
from src.db import SessionLocal
from src.models.cvat import Assignment, Image, Job, Project, Task, User
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
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        project_images = ["sample1.jpg", "sample2.png"]
        for image_filename in project_images:
            self.session.add(
                Image(
                    id=str(uuid.uuid4()), cvat_project_id=cvat_project_id, filename=image_filename
                )
            )

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatuses.completed.value,
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
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api") as mock_cvat_api,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            dummy_zip_file = io.BytesIO()
            with zipfile.ZipFile(dummy_zip_file, "w") as archive, TemporaryDirectory() as tempdir:
                mock_dataset = dm.Dataset(
                    media_type=dm.Image,
                    categories={
                        dm.AnnotationType.label: dm.LabelCategories.from_iterable(["cat", "dog"])
                    },
                )
                for image_filename in project_images:
                    mock_dataset.put(dm.DatasetItem(id=os.path.splitext(image_filename)[0]))
                mock_dataset.export(tempdir, format="coco_instances")

                for filename in list(glob(os.path.join(tempdir, "**/*"), recursive=True)):
                    archive.write(filename, os.path.relpath(filename, tempdir))
            dummy_zip_file.seek(0)

            mock_cvat_api.get_job_annotations.return_value = dummy_zip_file
            mock_cvat_api.get_project_annotations.return_value = dummy_zip_file

            mock_storage_client = Mock()
            mock_storage_client.create_file = Mock()
            mock_storage_client.list_files = Mock(return_value=[])
            mock_cloud_service.make_client = Mock(return_value=mock_storage_client)

            track_completed_escrows()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost.value)
            .first()
        )
        self.assertIsNotNone(webhook)
        self.assertEqual(webhook.event_type, ExchangeOracleEventTypes.task_finished)
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
            job_type=TaskTypes.image_label_binary.value,
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
            status=TaskStatuses.completed.value,
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

        track_completed_escrows()

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
            job_type=TaskTypes.image_label_binary.value,
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
            status=TaskStatuses.completed.value,
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
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api"),
            patch(
                "src.handlers.completed_escrows.cvat_api.get_job_annotations"
            ) as mock_annotations,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            mock_create_file = Mock()
            mock_storage_client = Mock()
            mock_storage_client.create_file = mock_create_file
            mock_cloud_service.make_client = Mock(return_value=mock_storage_client)

            mock_annotations.side_effect = Exception("Connection error")

            track_completed_escrows()

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
            job_type=TaskTypes.image_label_binary.value,
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
            status=TaskStatuses.completed.value,
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
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            track_completed_escrows()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost.value)
            .first()
        )
        self.assertIsNone(webhook)

        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.completed.value)
