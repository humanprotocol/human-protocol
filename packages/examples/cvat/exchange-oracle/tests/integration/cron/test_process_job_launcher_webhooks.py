import json
import unittest
import uuid
from unittest.mock import MagicMock, Mock, call, patch

from human_protocol_sdk.constants import ChainId, Status
from sqlalchemy.sql import select

from src.core.storage import compose_data_bucket_prefix, compose_results_bucket_prefix
from src.core.types import (
    ExchangeOracleEventTypes,
    JobLauncherEventTypes,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.crons.webhooks.job_launcher import (
    process_incoming_job_launcher_webhooks,
    process_outgoing_job_launcher_webhooks,
)
from src.cvat.api_calls import RequestStatus
from src.db import SessionLocal
from src.models.cvat import EscrowCreation, Image, Project
from src.models.webhook import Webhook
from src.services.cloud import StorageClient
from src.services.webhook import OracleWebhookDirectionTags

from tests.utils.constants import DEFAULT_MANIFEST_URL, JOB_LAUNCHER_ADDRESS
from tests.utils.dataset_helpers import build_gt_dataset

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_process_incoming_job_launcher_webhooks_escrow_created_type(self):
        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventTypes.escrow_created.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            open("tests/utils/manifest.json") as data,
            patch("src.handlers.job_creation.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.job_creation.cvat_api") as mock_cvat_api,
            patch("src.handlers.job_creation.cloud_service.make_client") as mock_make_cloud_client,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow.return_value = mock_escrow_data
            mock_cvat_object = Mock()
            mock_cvat_object.id = 1
            mock_cvat_api.create_project.return_value = mock_cvat_object

            mock_cvat_task = Mock()
            mock_cvat_task.id = 42
            mock_cvat_task.status = TaskStatuses.annotation.value
            mock_cvat_api.create_task.return_value = mock_cvat_task

            mock_cvat_api.create_cvat_webhook.return_value = mock_cvat_object
            mock_cvat_api.create_cloudstorage.return_value = mock_cvat_object
            mock_cvat_api.get_task_upload_status.return_value = (RequestStatus.FINISHED, "Finished")

            gt_filenames = ["image1.jpg", "image2.png"]
            gt_dataset = build_gt_dataset(gt_filenames).encode()

            mock_cloud_client = Mock()
            mock_cloud_client.download_file.return_value = gt_dataset
            mock_cloud_client.list_files.return_value = gt_filenames + ["image3.jpg", "image4.png"]
            mock_make_cloud_client.return_value = mock_cloud_client

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.completed.value
        assert updated_webhook.attempts == 1

        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_project.status == ProjectStatuses.creation.value

        db_escrow_creation_tracker = (
            self.session.query(EscrowCreation)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_escrow_creation_tracker.projects == [db_project]
        assert db_escrow_creation_tracker.total_jobs == 1

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
            event_type=JobLauncherEventTypes.escrow_created.value,
            direction=OracleWebhookDirectionTags.incoming,
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

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1

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
            event_type=JobLauncherEventTypes.escrow_created.value,
            direction=OracleWebhookDirectionTags.incoming,
            attempts=5,
        )

        self.session.add(webhook)
        self.session.commit()

        mock_storage_client = MagicMock(spec=StorageClient)
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            patch("src.services.cloud.make_client", return_value=mock_storage_client),
            patch("src.cvat.api_calls.delete_project") as delete_project_mock,
            patch("src.cvat.api_calls.delete_cloudstorage") as delete_cloudstorage_mock,
        ):
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        self.session.commit()

        updated_webhook = self.session.query(Webhook).filter_by(id=webhok_id).first()

        assert updated_webhook.status == OracleWebhookStatuses.failed.value
        assert updated_webhook.attempts == 6

        new_webhook = (
            self.session.query(Webhook)
            .filter_by(
                escrow_address=escrow_address,
                chain_id=chain_id,
                type=OracleWebhookTypes.job_launcher,
            )
            .first()
        )

        assert new_webhook.status == OracleWebhookStatuses.pending.value
        assert new_webhook.event_type == ExchangeOracleEventTypes.escrow_failed
        assert new_webhook.attempts == 0
        assert mock_storage_client.remove_files.mock_calls == [
            call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
            call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
        ]

        assert delete_project_mock.mock_calls == []
        assert delete_cloudstorage_mock.mock_calls == []

        outgoing_webhooks: list[Webhook] = list(
            self.session.scalars(
                select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
            )
        )
        assert len(outgoing_webhooks) == 1
        outgoing_webhook = outgoing_webhooks[0]

        assert outgoing_webhook.type == OracleWebhookTypes.job_launcher
        assert outgoing_webhook.event_type == ExchangeOracleEventTypes.escrow_failed

        assert mock_storage_client.remove_files.mock_calls == [
            call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
            call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
        ]

        assert delete_project_mock.mock_calls == []
        assert delete_cloudstorage_mock.mock_calls == []

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
            event_type=JobLauncherEventTypes.escrow_created.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            open("tests/utils/manifest.json") as data,
            patch("src.handlers.job_creation.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.job_creation.cvat_api") as mock_cvat_api,
            patch("src.handlers.job_creation.cloud_service.make_client") as mock_make_cloud_client,
            patch(
                "src.handlers.job_creation.db_service.add_project_images",
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

            gt_filenames = ["image1.jpg", "image2.png"]
            gt_dataset = build_gt_dataset(gt_filenames).encode()

            mock_cloud_client = Mock()
            mock_cloud_client.download_file.return_value = gt_dataset
            mock_cloud_client.list_files.return_value = gt_filenames + ["image3.jpg", "image4.png"]
            mock_make_cloud_client.return_value = mock_cloud_client

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1

        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_project is None

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type(self):
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

        project_images = [
            Image(
                id=str(uuid.uuid4()),
                cvat_project_id=cvat_project.cvat_id,
                filename=f"image_{i}.jpg",
            )
            for i in range(3)
        ]
        self.session.add_all(project_images)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventTypes.escrow_canceled.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()

        from src.services.cvat import remove_escrow_images as original_remove_escrow_images

        mock_storage_client = MagicMock(spec=StorageClient)
        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            patch("src.services.cloud.make_client", return_value=mock_storage_client),
            patch(
                "src.services.cvat.remove_escrow_images", side_effect=original_remove_escrow_images
            ) as remove_escrow_images_mock,
            patch("src.cvat.api_calls.delete_project") as delete_project_mock,
            patch("src.cvat.api_calls.delete_cloudstorage") as delete_cloudstorage_mock,
        ):
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow_data.balance = 1
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.completed.value
        assert updated_webhook.attempts == 1
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        assert db_project.status == ProjectStatuses.canceled.value

        assert mock_storage_client.remove_files.mock_calls == [
            call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
            call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
        ]

        assert delete_project_mock.mock_calls == [call(1)]
        assert delete_cloudstorage_mock.mock_calls == [call(1)]

        assert len(remove_escrow_images_mock.mock_calls) == 1
        assert "session" in remove_escrow_images_mock.mock_calls[0].kwargs
        assert {
            k: v
            for k, v in remove_escrow_images_mock.mock_calls[0].kwargs.items()
            if k in ("escrow_address", "chain_id")
        } == {"escrow_address": escrow_address, "chain_id": chain_id}
        assert (
            self.session.query(Image)
            .where(
                Image.project.has(
                    (Project.escrow_address == escrow_address) & (Project.chain_id == chain_id)
                )
            )
            .count()
            == 0
        )

        outgoing_webhooks: list[Webhook] = list(
            self.session.scalars(
                select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
            )
        )
        assert len(outgoing_webhooks) == 1
        outgoing_webhook = outgoing_webhooks[0]

        assert outgoing_webhook.type == OracleWebhookTypes.recording_oracle
        assert outgoing_webhook.event_type == ExchangeOracleEventTypes.escrow_cleaned

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type_with_multiple_creating_projects(  # noqa: E501
        self,
    ):
        project_ids = []
        for i in range(3):
            cvat_project = Project(
                id=str(uuid.uuid4()),
                cvat_id=i,
                cvat_cloudstorage_id=i,
                status=ProjectStatuses.creation.value,
                job_type=TaskTypes.image_skeletons_from_boxes.value,
                escrow_address=escrow_address,
                chain_id=chain_id,
                bucket_url="https://test.storage.googleapis.com/",
            )
            project_ids.append(cvat_project.id)
            self.session.add(cvat_project)

        escrow_creation = EscrowCreation(
            id=str(uuid.uuid4()),
            escrow_address=escrow_address,
            chain_id=chain_id,
            total_jobs=10,
        )
        self.session.add(escrow_creation)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventTypes.escrow_canceled.value,
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        self.session.commit()

        mock_storage_client = MagicMock(spec=StorageClient)

        with (
            patch("src.chain.escrow.get_escrow") as mock_escrow,
            patch("src.services.cloud.make_client", return_value=mock_storage_client),
            patch("src.cvat.api_calls.delete_project") as delete_project_mock,
            patch("src.cvat.api_calls.delete_cloudstorage") as delete_cloudstorage_mock,
        ):
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Pending.name
            mock_escrow_data.balance = 1
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.completed.value
        assert updated_webhook.attempts == 1
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        assert db_project.status == ProjectStatuses.canceled.value

        db_escrow_creation_tracker = (
            self.session.query(EscrowCreation)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert bool(db_escrow_creation_tracker.finished_at)

        assert db_project.status == ProjectStatuses.canceled.value

        assert mock_storage_client.remove_files.mock_calls == [
            call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
            call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
        ]

        assert delete_project_mock.mock_calls == [call(0), call(1), call(2)]
        assert delete_cloudstorage_mock.mock_calls == [call(0), call(1), call(2)]

        outgoing_webhooks: list[Webhook] = list(
            self.session.scalars(
                select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
            )
        )
        assert len(outgoing_webhooks) == 1
        outgoing_webhook = outgoing_webhooks[0]

        assert outgoing_webhook.type == OracleWebhookTypes.recording_oracle
        assert outgoing_webhook.event_type == ExchangeOracleEventTypes.escrow_cleaned

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type_invalid_status(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
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
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventTypes.escrow_canceled.value,
            direction=OracleWebhookDirectionTags.incoming,
        )

        self.session.add(webhook)
        self.session.commit()
        with patch("src.chain.escrow.get_escrow") as mock_escrow:
            mock_escrow_data = Mock()
            mock_escrow_data.status = Status.Complete.name
            mock_escrow.return_value = mock_escrow_data

            process_incoming_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        assert db_project.status == ProjectStatuses.annotation.value

    def test_process_incoming_job_launcher_webhooks_escrow_canceled_type_invalid_balance(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
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
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventTypes.escrow_canceled.value,
            direction=OracleWebhookDirectionTags.incoming,
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
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1
        db_project = (
            self.session.query(Project)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )

        assert db_project.status == ProjectStatuses.annotation.value

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
            event_type=ExchangeOracleEventTypes.job_finished.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.kvstore.get_escrow") as mock_escrow,
            patch("src.chain.kvstore.OperatorUtils.get_operator") as mock_operator,
            patch("httpx.Client.post") as mock_httpx_post,
        ):
            w3 = Mock()
            w3.eth.chain_id = ChainId.LOCALHOST.value
            mock_escrow_data = Mock()
            mock_escrow_data.launcher = JOB_LAUNCHER_ADDRESS
            mock_escrow.return_value = mock_escrow_data
            mock_operator.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_httpx_post.return_value = mock_response

            process_outgoing_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.completed.value
        assert updated_webhook.attempts == 1
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
            event_type=JobLauncherEventTypes.escrow_created.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1
