import unittest
import uuid
from unittest.mock import patch
from src.models.cvat import Project

from sqlalchemy.sql import select
from src.core.constants import Networks
from src.db import SessionLocal
from src.core.constants import (
    OracleWebhookStatuses,
    OracleWebhookTypes,
)
from src.crons.process_job_launcher_webhooks import (
    process_job_launcher_webhooks,
)
from src.models.webhook import Webhook
from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV
from tests.utils.setup_escrow import create_escrow, fund_escrow
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()
        self.w3 = Web3(HTTPProvider())

        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        self.w3.eth.default_account = self.gas_payer.address

    def tearDown(self):
        self.session.close()

    @patch("src.cvat.create_job.cvat_api")
    def test_process_job_launcher_webhooks_successful(self, mock_cvat_api):
        mock_cvat_api.create_cloudstorage.return_value.id = 1
        mock_cvat_api.create_project.return_value.id = 1
        mock_cvat_api.create_task.return_value.id = 1
        mock_cvat_api.create_task.return_value.status = "annotation"

        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )
        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)

        mock_cvat_api.create_cloudstorage.assert_called_once_with(
            "GOOGLE_CLOUD_STORAGE", "test"
        )
        mock_cvat_api.create_project.assert_called_once_with(
            escrow_address, [{"name": "dummy_label", "type": "tag"}]
        )
        mock_cvat_api.create_task.assert_called_once_with(
            mock_cvat_api.create_cloudstorage.return_value.id, escrow_address
        )

    def test_process_job_launcher_webhooks_invalid_escrow_address(self):
        chain_id = Networks.localhost.value
        escrow_address = "invalid_address"

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Invalid escrow address: invalid_address"
            ],
        )

    def test_process_job_launcher_webhooks_invalid_escrow_balance(self):
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Escrow doesn't have funds"
            ],
        )

    def test_process_job_launcher_webhooks_invalid_manifest_url(self):
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertTrue(
            f"ERROR:app:Webhook: {webhok_id} failed during execution. Error HTTPConnectionPool(host='localhost', port=8080): Max retries exceeded with url: /api/cloudstorages"
            in cm.output[0],
        )

    @patch("src.cvat.create_job.cvat_api")
    def test_process_job_launcher_webhooks_invalid_cloudstorage(self, mock_cvat_api):
        mock_cvat_api.create_cloudstorage.side_effect = Exception("Connection error")
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Connection error"
            ],
        )

    @patch("src.cvat.create_job.cvat_api")
    def test_process_job_launcher_webhooks_invalid_project(self, mock_cvat_api):
        mock_cvat_api.create_cloudstorage.return_value.id = 1
        mock_cvat_api.create_project.side_effect = Exception("Connection error")
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Connection error"
            ],
        )

    @patch("src.cvat.revert_job.cvat_api")
    @patch("src.cvat.create_job.cvat_api")
    def test_process_job_launcher_webhooks_invalid_task(
        self, mock_create_cvat_api, mock_revert_cvat_api
    ):
        mock_create_cvat_api.create_cloudstorage.return_value.id = 1
        mock_create_cvat_api.create_project.return_value.id = 1
        mock_create_cvat_api.create_task.side_effect = Exception("Connection error")
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_job_launcher_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        project = (
            self.session.execute(
                select(Project).where(
                    Project.cvat_id
                    == mock_create_cvat_api.create_project.return_value.id
                )
            )
            .scalars()
            .first()
        )

        self.assertIsNone(project)
        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Connection error"
            ],
        )
