import unittest
import uuid
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.constants import ChainId
from sqlalchemy.sql import select

from src.core.types import (
    ExchangeOracleEventTypes,
    JobStatuses,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    RecordingOracleEventTypes,
    TaskStatuses,
    TaskTypes,
)
from src.crons.process_recording_oracle_webhooks import (
    process_incoming_recording_oracle_webhooks,
    process_outgoing_recording_oracle_webhooks,
)
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTags

from tests.utils.constants import DEFAULT_MANIFEST_URL, RECORDING_ORACLE_ADDRESS

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_process_incoming_recording_oracle_webhooks_task_completed_type(self):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_completed.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.recorded.value)

    def test_process_incoming_recording_oracle_webhooks_task_completed_type_invalid_project_status(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_completed.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)

        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.completed.value)

    def test_process_incoming_recording_oracle_webhooks_task_task_rejected_type(self):
        cvat_id = 1

        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)
        task_id = str(uuid.uuid4())
        cvat_task = Task(
            id=task_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=TaskStatuses.completed.value,
        )
        self.session.add(cvat_task)

        job_id = str(uuid.uuid4())
        cvat_job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            status=JobStatuses.completed,
        )
        self.session.add(cvat_job)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_rejected.value,
            event_data={"rejected_job_ids": [cvat_id]},
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.annotation.value)

        db_task = self.session.query(Task).filter_by(id=task_id).first()

        self.assertEqual(db_task.status, TaskStatuses.annotation.value)

        db_job = self.session.query(Job).filter_by(id=job_id).first()

        self.assertEqual(db_job.status, JobStatuses.new.value)

    def test_process_incoming_recording_oracle_webhooks_task_task_rejected_type_invalid_project_status(
        self,
    ):
        cvat_id = 1

        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_rejected.value,
            event_data={"rejected_job_ids": [cvat_id]},
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)

        db_project = self.session.query(Project).filter_by(id=project_id).first()

        self.assertEqual(db_project.status, ProjectStatuses.completed.value)

    def test_process_outgoing_recording_oracle_webhooks(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=ExchangeOracleEventTypes.task_finished.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.kvstore.get_escrow") as mock_escrow,
            patch("src.chain.kvstore.OperatorUtils.get_leader") as mock_leader,
            patch("httpx.Client.post") as mock_httpx_post,
        ):
            w3 = Mock()
            w3.eth.chain_id = ChainId.LOCALHOST.value
            mock_escrow_data = Mock()
            mock_escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = mock_escrow_data
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_httpx_post.return_value = mock_response

            process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        mock_httpx_post.assert_called_once()

    def test_process_outgoing_recording_oracle_webhooks_invalid_type(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_completed.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
