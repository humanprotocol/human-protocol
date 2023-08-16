import unittest
import uuid
from unittest.mock import patch

from sqlalchemy.sql import select
from src.core.constants import Networks
from src.db import SessionLocal
from src.crons.retrieve_annotations import retrieve_annotations
from src.models.webhook import Webhook
from tests.unit.helpers.predefined_annotations import raw_binary_annotations
from src.core.constants import (
    ProjectStatuses,
    JobTypes,
    TaskStatuses,
    JobStatuses,
)
from src.models.cvat import Project, Task, Job
from src.core.constants import (
    OracleWebhookTypes,
    OracleWebhookStatuses,
)
from human_protocol_sdk.storage import StorageClient
from src.core.config import StorageConfig


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    @patch("src.cvat.api_calls.get_job_annotations")
    def test_process_recording_oracle_webhooks(self, mock_annotations):
        mock_annotations.return_value = raw_binary_annotations
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=JobTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
            assignee="John Doe",
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        retrieve_annotations()

        webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address
                    and Webhook.chain_id == Networks.localhost.value
                )
            )
            .scalars()
            .first()
        )
        self.assertEqual(webhook.type, OracleWebhookTypes.recording_oracle.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)
        self.assertIsNotNone(
            webhook.signature,
            "0x8d1b4e3c5e98ea57280b5910e110bf8000b1dfd9a2b9d16349eadeba46c6e373778e5368eaffaef4cd1c915046b1c706da9e6b9200b2c71eb1217305267d3e311c",
        )

        file = StorageClient.download_file_from_url(
            f"http://{StorageConfig.endpoint_url}/{StorageConfig.results_bucket_name}/s36f849163dce528923b9ecd81089903bad5c461f6.json"
        ).decode()

        self.assertEqual(
            file,
            '[{"answers": [{"assignee": "John Doe", "tag": "dummy_label"}], "url": "https://test.storage.googleapis.com/1.jpg"}, {"answers": [{"assignee": "John Doe", "tag": "dummy_label"}], "url": "https://test.storage.googleapis.com/2.jpg"}, {"answers": [{"assignee": "John Doe", "tag": "dummy_label"}], "url": "https://test.storage.googleapis.com/3.jpg"}]',
        )

        project = (
            self.session.execute(select(Project).where(Project.id == project_id))
            .scalars()
            .first()
        )

        self.assertEqual(project.status, ProjectStatuses.recorded.value)

    def test_process_recording_oracle_webhooks_unfinished_jobs(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=JobTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.in_progress.value,
            assignee="John Doe",
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        retrieve_annotations()

        webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address
                    and Webhook.chain_id == Networks.localhost.value
                )
            )
            .scalars()
            .first()
        )
        self.assertIsNone(webhook)

        project = (
            self.session.execute(select(Project).where(Project.id == project_id))
            .scalars()
            .first()
        )

        self.assertEqual(project.status, ProjectStatuses.annotation.value)

    @patch("src.cvat.api_calls.get_job_annotations")
    def test_process_recording_oracle_webhooks_error_getting_annotations(
        self, mock_annotations
    ):
        mock_annotations.side_effect = Exception("Connection error")
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=JobTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
            assignee="John Doe",
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            retrieve_annotations()

        webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address
                    and Webhook.chain_id == Networks.localhost.value
                )
            )
            .scalars()
            .first()
        )
        self.assertIsNone(webhook)

        project = (
            self.session.execute(select(Project).where(Project.id == project_id))
            .scalars()
            .first()
        )

        self.assertEqual(project.status, ProjectStatuses.completed.value)

        self.assertEqual(
            cm.output,
            [f"ERROR:app:[cron][cvat][retrieve_annotations] Connection error"],
        )

    @patch("src.cvat.api_calls.get_job_annotations")
    @patch("src.core.config.StorageConfig.secure")
    def test_process_recording_oracle_webhooks_error_uploading_files(
        self, mock_storage_config, mock_annotations
    ):
        mock_annotations.return_value = raw_binary_annotations
        mock_storage_config.return_value = True
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=JobTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
            assignee="John Doe",
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            retrieve_annotations()

        webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address
                    and Webhook.chain_id == Networks.localhost.value
                )
            )
            .scalars()
            .first()
        )
        self.assertIsNone(webhook)

        self.assertNotEqual(
            cm.output,
            [],
        )

    @patch("src.cvat.api_calls.get_job_annotations")
    def test_process_recording_oracle_webhooks_invalid_chain_id(self, mock_annotations):
        mock_annotations.return_value = raw_binary_annotations
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=JobTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=1234,
            bucket_url="https://test.storage.googleapis.com/",
        )

        task = Task(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=1,
            status=TaskStatuses.completed.value,
        )

        job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_task_id=1,
            cvat_project_id=1,
            status=JobStatuses.completed.value,
            assignee="John Doe",
        )

        self.session.add(project)
        self.session.add(task)
        self.session.add(job)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            retrieve_annotations()

        webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address
                    and Webhook.chain_id == Networks.localhost.value
                )
            )
            .scalars()
            .first()
        )
        self.assertIsNone(webhook)

        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:[cron][cvat][retrieve_annotations] 1234 is not in available list of networks."
            ],
        )
