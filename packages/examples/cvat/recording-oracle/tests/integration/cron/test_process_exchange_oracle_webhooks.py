import unittest
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, call, patch

from sqlalchemy.sql import select
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.core.storage import compose_data_bucket_prefix, compose_results_bucket_prefix
from src.core.types import (
    ExchangeOracleEventTypes,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
)
from src.crons.process_exchange_oracle_webhooks import process_incoming_exchange_oracle_webhooks
from src.db import SessionLocal
from src.models.validation import Task
from src.models.webhook import Webhook
from src.services.cloud import StorageClient
from src.services.webhook import OracleWebhookDirectionTags

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

    def make_webhook(self, escrow_address, event_type=ExchangeOracleEventTypes.task_finished):
        return Webhook(
            id=str(uuid.uuid4()),
            direction=OracleWebhookDirectionTags.incoming.value,
            signature=SIGNATURE,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            type=OracleWebhookTypes.exchange_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=event_type,
            wait_until=datetime.now(timezone.utc),
        )

    def test_process_exchange_oracle_webhook(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhook = self.make_webhook(escrow_address)
        self.session.add(webhook)
        self.session.commit()

        with patch("src.crons.process_exchange_oracle_webhooks.handle_exchange_oracle_event"):
            process_incoming_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id)).scalars().first()
        )
        assert updated_webhook.status == OracleWebhookStatuses.completed
        assert updated_webhook.attempts == 1

    def test_process_exchange_oracle_webhook_escrow_cleaned(self):
        escrow_address = "123"
        webhook = self.make_webhook(escrow_address, ExchangeOracleEventTypes.escrow_cleaned)
        self.session.add(webhook)
        task_id = str(uuid.uuid4())
        task = Task(id=task_id, escrow_address=escrow_address, chain_id=webhook.chain_id)
        self.session.add(task)
        self.session.commit()

        mock_storage_client = MagicMock(spec=StorageClient)
        with (
            patch("src.chain.escrow.get_escrow"),
            patch("src.services.cloud.make_client", return_value=mock_storage_client),
        ):
            process_incoming_exchange_oracle_webhooks()

        self.session.refresh(webhook)
        self.session.refresh(task)
        assert webhook.status == OracleWebhookStatuses.completed
        assert webhook.attempts == 1

        assert task.cleaned_at.date() == datetime.now(timezone.utc).date()

        assert mock_storage_client.remove_files.mock_calls == [
            call(prefix=compose_data_bucket_prefix(escrow_address, webhook.chain_id)),
            call(prefix=compose_results_bucket_prefix(escrow_address, webhook.chain_id)),
        ]

    def test_process_recording_oracle_webhooks_invalid_escrow_address(self):
        escrow_address = "invalid_address"
        webhook = self.make_webhook(escrow_address)
        self.session.add(webhook)
        self.session.commit()

        with patch(
            "src.crons.process_exchange_oracle_webhooks.handle_exchange_oracle_event"
        ) as mock_handler:
            mock_handler.side_effect = Exception(f"Can't find escrow {escrow_address}")
            process_incoming_exchange_oracle_webhooks()
            mock_handler.assert_called_once()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1

    def test_process_recording_oracle_webhooks_invalid_escrow_balance(self):
        escrow_address = create_escrow(self.w3)

        webhook = self.make_webhook(escrow_address)

        self.session.add(webhook)
        self.session.commit()
        with patch(
            "src.crons.process_exchange_oracle_webhooks.handle_exchange_oracle_event"
        ) as mock_handler:
            mock_handler.side_effect = ValueError("Escrow doesn't have funds")
            process_incoming_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1

    @patch("src.chain.escrow.EscrowClient.get_manifest_url")
    def test_process_job_launcher_webhooks_invalid_manifest_url(self, mock_manifest_url):
        mock_manifest_url.return_value = "invalid_url"
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)

        webhook = self.make_webhook(escrow_address)

        self.session.add(webhook)
        self.session.commit()

        process_incoming_exchange_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1
