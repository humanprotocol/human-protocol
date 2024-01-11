import unittest
import uuid
from unittest.mock import MagicMock, patch

from sqlalchemy.sql import select
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.core.types import Networks, OracleWebhookSenderType, OracleWebhookStatuses
from src.crons.process_recording_oracle_webhooks import process_outgoing_recording_oracle_webhooks
from src.db import SessionLocal
from src.models.webhook import Webhook

from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV
from tests.utils.setup_escrow import create_escrow
from tests.utils.setup_kvstore import store_kvstore_value


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

    @patch("httpx.Client.post")
    def test_process_recording_oracle_webhooks(self, mock_httpx_post):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_httpx_post.return_value = mock_response
        expected_url = "expected_url"

        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        store_kvstore_value(expected_url)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            s3_url="s3_url",
            type=OracleWebhookSenderType.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)
        mock_httpx_post.assert_called_once_with(
            expected_url,
            headers={"human-signature": "signature"},
            json={
                "escrow_address": escrow_address,
                "chain_id": chain_id,
                "s3_url": "s3_url",
            },
        )

    def test_process_recording_oracle_webhooks_invalid_escrow_address(self):
        chain_id = Networks.localhost.value
        escrow_address = "invalid_address"

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            s3_url="s3_url",
            type=OracleWebhookSenderType.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:[cron][webhook][process_recording_oracle_webhooks] Webhook: {webhok_id} failed during execution. Error Invalid escrow address: invalid_address"
            ],
        )

    def test_process_recording_oracle_webhooks_invalid_recording_oracle_url(
        self,
    ):
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            s3_url="s3_url",
            type=OracleWebhookSenderType.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:[cron][webhook][process_recording_oracle_webhooks] Webhook: {webhok_id} failed during execution. Error Request URL is missing an 'http://' or 'https://' protocol."
            ],
        )

    @patch("httpx.Client.post")
    def test_process_recording_oracle_webhooks_invalid_request(self, mock_httpx_post):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = Exception("The requested URL was not found.")
        mock_httpx_post.return_value = mock_response
        expected_url = "expected_url"

        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        store_kvstore_value(expected_url)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            s3_url="s3_url",
            type=OracleWebhookSenderType.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertEqual(
            cm.output,
            [
                f"ERROR:app:[cron][webhook][process_recording_oracle_webhooks] Webhook: {webhok_id} failed during execution. Error The requested URL was not found."
            ],
        )
