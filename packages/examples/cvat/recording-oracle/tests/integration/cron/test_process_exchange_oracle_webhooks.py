import unittest
import uuid
from unittest.mock import patch

from human_protocol_sdk.storage import StorageClient
from sqlalchemy.sql import select
from src.core.config import StorageConfig
from src.core.constants import Networks
from src.db import SessionLocal
from src.core.constants import OracleWebhookStatuses, OracleWebhookTypes
from src.crons.process_exchange_oracle_webhooks import (
    process_exchange_oracle_webhooks,
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

    def test_process_exchange_oracle_webhook(self):
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

        process_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id))
            .scalars()
            .first()
        )
        self.assertEqual(updated_webhook.status, OracleWebhookStatuses.completed.value)
        self.assertEqual(updated_webhook.attempts, 1)

        reputation_oracle_webhook = (
            self.session.execute(
                select(Webhook).where(
                    Webhook.escrow_address == escrow_address,
                    Webhook.type == OracleWebhookTypes.reputation_oracle.value,
                )
            )
            .scalars()
            .first()
        )
        self.assertEqual(
            reputation_oracle_webhook.status, OracleWebhookStatuses.pending.value
        )

        self.assertIsNotNone(
            webhook.signature,
        )
        self.assertIsInstance(webhook.signature, str)

        file_name = reputation_oracle_webhook.s3_url.split("/")[-1]
        file = StorageClient.download_file_from_url(
            f"http://{StorageConfig.endpoint_url}/{StorageConfig.results_bucket_name}/{file_name}"
        ).decode()

        self.assertIsNotNone(file)
        self.assertIsInstance(file, str)

    def test_process_recording_oracle_webhooks_invalid_escrow_address(self):
        chain_id = Networks.localhost.value
        escrow_address = "invalid_address"

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
                f"ERROR:app:Webhook: {webhok_id} failed during execution. Error Invalid escrow address: invalid_address"
            ],
        )

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
