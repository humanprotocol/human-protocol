import json
import unittest
import uuid
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.constants import ChainId, Status
from sqlalchemy.sql import select

from src.core.types import (
    ExchangeOracleEventType,
    JobLauncherEventType,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    TaskType,
)
from src.crons.process_job_launcher_webhooks import (
    process_incoming_job_launcher_webhooks,
    process_outgoing_job_launcher_webhooks,
)
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTag

from tests.utils.constants import DEFAULT_URL, JOB_LAUNCHER_ADDRESS

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_process_incoming_job_launcher_webhooks_escrow_created_type(self):
        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            open("tests/utils/manifest.json") as data,
            patch("src.cvat.tasks.get_escrow_manifest") as mock_get_manifest,
            patch("src.cvat.tasks.cvat_api") as mock_cvat_api,
            patch("src.cvat.tasks.cloud_service") as mock_cloud_service,
            patch("src.cvat.tasks.get_gt_filenames") as mock_gt_filenames,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow.return_value = mock_escrow_data
            mock_cvat_id = Mock()
            mock_cvat_id.id = 1
            mock_cvat_api.create_project.return_value = mock_cvat_id
            mock_cvat_api.create_cvat_webhook.return_value = mock_cvat_id
            mock_cvat_api.create_cloudstorage.return_value = mock_cvat_id
            filenames = [
                "image1.jpg",
                "image2.jpg",
            ]
            mock_gt_filenames.return_value = filenames
            mock_cloud_service.list_files.return_value = filenames

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        self.assertEqual(db_project.status, ProjectStatuses.annotation.value)

    def test_process_incoming_job_launcher_webhooks_escrow_created_type_invalid_escrow_status(
        self,
    ):
        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Complete.name
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        self.session.commit()

        updated_webhook = self.session.query(Webhook).filter_by(id=webhok_id).first()

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)

    def test_process_incoming_job_launcher_webhooks_escrow_created_type_exceed_max_retries(
        self,
    ):
        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=OracleWebhookDirectionTag.incoming,
            attempts=5,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        self.session.commit()

        updated_webhook = self.session.query(Webhook).filter_by(id=webhok_id).first()

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.failed.value)
        self.assertEqual(updated_webhook.attempts, 6)

        new_webhook = (
            self.session.query(Webhook)
            .filter_by(
                escrow_address=escrow_address,
                chain_id=chain_id,
                type=OracleWebhookTypes.job_launcher,
            )
            .first()
        )

        self.assertEqual(new_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(new_webhook.event_type, ExchangeOracleEventType.task_creation_failed)
        self.assertEqual(new_webhook.attempts, 0)

    def test_process_incoming_job_launcher_webhooks_escrow_created_type_remove_when_error(
        self,
    ):
        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            open("tests/utils/manifest.json") as data,
            patch("src.cvat.tasks.get_escrow_manifest") as mock_get_manifest,
            patch("src.cvat.tasks.cvat_api") as mock_cvat_api,
            patch("src.cvat.tasks.cloud_service"),
            patch("src.cvat.tasks.get_gt_filenames"),
            patch(
                "src.cvat.tasks.db_service.add_project_images",
                side_effect=Exception("Error"),
            ),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow.return_value = mock_escrow_data
            mock_cvat_id = Mock()
            mock_cvat_id.id = 1
            mock_cvat_api.create_project.return_value = mock_cvat_id
            mock_cvat_api.create_cloudstorage.return_value = mock_cvat_id
            mock_cvat_api.create_cvat_webhook.return_value = mock_cvat_id

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)

        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        self.assertIsNone(db_project)

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type(self):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskType.image_label_binary.value,
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
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_canceled.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow_data.balance = 1
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        self.assertEqual(db_project.status, ProjectStatuses.canceled.value)

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type_invalid_status(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskType.image_label_binary.value,
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
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_canceled.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Complete.name
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        self.assertEqual(db_project.status, ProjectStatuses.annotation.value)

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type_invalid_balance(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskType.image_label_binary.value,
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
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_canceled.value,
            direction=OracleWebhookDirectionTag.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Complete.name
            mock_escrow_data.balance = 0
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        self.assertEqual(db_project.status, ProjectStatuses.annotation.value)

    def test_process_outgoing_job_launcher_webhooks(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=ExchangeOracleEventType.task_finished.value,
            direction=OracleWebhookDirectionTag.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.kvstore.get_escrow") as mock_escrow,
            patch("src.chain.kvstore.StakingUtils.get_leader") as mock_leader,
            patch("httpx.Client.post") as mock_httpx_post,
        ):
            w3 = Mock()
            w3.eth.chain_id = ChainId.LOCALHOST.value
            mock_escrow_data = Mock()
            mock_escrow_data.launcher = JOB_LAUNCHER_ADDRESS
            mock_escrow.return_value = mock_escrow_data
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_URL)
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_httpx_post.return_value = mock_response

            process_outgoing_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        mock_httpx_post.assert_called_once()

    def test_process_outgoing_job_launcher_webhooks_invalid_type(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=OracleWebhookDirectionTag.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
