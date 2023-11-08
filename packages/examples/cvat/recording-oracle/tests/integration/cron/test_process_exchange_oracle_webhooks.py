import unittest
import uuid
from unittest.mock import patch

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.storage import StorageClient
from sqlalchemy.sql import select
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.core.config import StorageConfig
from src.core.types import (
    ExchangeOracleEventType,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
)
from src.crons.process_exchange_oracle_webhooks import (
    process_incoming_exchange_oracle_webhooks,
    process_outgoing_exchange_oracle_webhooks,
)
from src.db import SessionLocal
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTag
from src.utils.logging import get_function_logger

from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV, SIGNATURE
from tests.utils.setup_escrow import create_escrow, fund_escrow


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

    def test_process_exchange_oracle_webhook(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhook = Webhook(
            id=str(uuid.uuid4()),
            direction=OracleWebhookDirectionTag.incoming.value,
            signature=SIGNATURE,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=ExchangeOracleEventType.task_finished.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with patch(
            "src.crons.process_exchange_oracle_webhooks.handle_exchange_oracle_event"
        ):
            process_incoming_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id))
            .scalars()
            .first()
        )
        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed)
        self.assertEqual(updated_webhook.attempts, 1)

    def test_process_recording_oracle_webhooks_invalid_escrow_address(self):
        webhook = Webhook(
            id=str(uuid.uuid4()),
            direction=OracleWebhookDirectionTag.incoming.value,
            signature=SIGNATURE,
            escrow_address="invalid_address",
            chain_id=Networks.localhost.value,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=ExchangeOracleEventType.task_finished.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with (
            patch(
                "src.crons.process_exchange_oracle_webhooks.handle_exchange_oracle_event"
            ) as mock_handler
        ):
            mock_handler.side_effect = ValueError()
            process_incoming_exchange_oracle_webhooks()
            mock_handler.assert_called_once()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)

    def test_process_recording_oracle_webhooks_invalid_escrow_balance(self):
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            s3_url="http://host.docker.internal:9000/results/intermediate-results.json",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_exchange_oracle_webhooks()

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

    @patch("src.chain.escrow.EscrowClient.get_manifest_url")
    def test_process_job_launcher_webhooks_invalid_manifest_url(
        self, mock_manifest_url
    ):
        mock_manifest_url.return_value = "invalid_url"
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            s3_url="http://host.docker.internal:9000/results/intermediate-results.json",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertTrue(
            f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Invalid URL: invalid_url"
            in cm.output[0],
        )

    def test_process_job_launcher_webhooks_invalid_intermediate_results_url(self):
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            s3_url="invalid_url",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertTrue(
            f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Invalid URL: invalid_url"
            in cm.output[0],
        )

    @patch("src.core.config.StorageConfig.secure")
    def test_process_job_launcher_webhooks_error_uploading_files(
        self, mock_storage_config
    ):
        mock_storage_config.return_value = True
        chain_id = Networks.localhost.value
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            s3_url="http://host.docker.internal:9000/results/intermediate-results.json",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook)
        self.session.commit()

        with self.assertLogs(level="ERROR") as cm:
            process_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )

        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.pending.value)
        self.assertEqual(updated_webhook.attempts, 1)
        self.assertNotEqual(
            cm.output,
            [],
        )
