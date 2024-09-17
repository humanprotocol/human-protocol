import unittest
import uuid
from unittest.mock import MagicMock, patch

from sqlalchemy.sql import select
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.core.types import (
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    RecordingOracleEventTypes,
)
from src.crons.process_reputation_oracle_webhooks import process_outgoing_reputation_oracle_webhooks
from src.db import SessionLocal
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTags

from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV, SIGNATURE
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

    def get_webhook(self, escrow_address, chain_id, event_data):
        return Webhook(
            id=str(uuid.uuid4()),
            direction=OracleWebhookDirectionTags.outgoing.value,
            signature=SIGNATURE,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.reputation_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.task_completed,
            event_data=event_data,
        )

    def test_process_reputation_oracle_webhooks(self):
        expected_url = "expected_url"
        with (
            patch("src.crons._utils.httpx.Client.post") as mock_httpx,
            patch("src.crons._utils.prepare_signed_message") as mock_signature,
            patch(
                "src.crons.process_reputation_oracle_webhooks.get_reputation_oracle_url"
            ) as mock_get_repo_url,
        ):
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_httpx.return_value = mock_response
            mock_get_repo_url.return_value = expected_url

            chain_id = Networks.localhost.value
            escrow_address = create_escrow(self.w3)
            store_kvstore_value("webhook_url", expected_url)
            event_data = {}
            mock_signature.return_value = (None, SIGNATURE)

            webhook = self.get_webhook(escrow_address, chain_id, event_data)
            self.session.add(webhook)
            self.session.commit()

            process_outgoing_reputation_oracle_webhooks()

            updated_webhook = (
                self.session.execute(select(Webhook).where(Webhook.id == webhook.id))
                .scalars()
                .first()
            )

            mock_signature.assert_called_once()
            mock_get_repo_url.assert_called_once_with(webhook.chain_id, webhook.escrow_address)
            mock_httpx.assert_called_once_with(
                expected_url,
                headers={"human-signature": SIGNATURE},
                json={
                    "escrow_address": escrow_address,
                    "chain_id": chain_id,
                    "event_type": RecordingOracleEventTypes.task_completed.value,
                },
            )
            assert updated_webhook.status == OracleWebhookStatuses.completed.value
            assert updated_webhook.attempts == 1

    def test_process_reputation_oracle_webhooks_invalid_escrow_address(self):
        chain_id = Networks.localhost.value
        escrow_address = "invalid_address"
        event_data = {}
        webhook = self.get_webhook(escrow_address, chain_id, event_data)

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_reputation_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhook.id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1

    def test_process_reputation_oracle_webhooks_invalid_reputation_oracle_url(self):
        with patch(
            "src.crons.process_reputation_oracle_webhooks.get_reputation_oracle_url"
        ) as mock_get_repo_url:
            mock_get_repo_url.return_value = "https://not.a.real/url/existing.somewhere"

            webhook = self.get_webhook(create_escrow(self.w3), Networks.localhost.value, {})
            self.session.add(webhook)
            self.session.commit()
            process_outgoing_reputation_oracle_webhooks()

            updated_webhook = (
                self.session.execute(select(Webhook).where(Webhook.id == webhook.id))
                .scalars()
                .first()
            )
            assert updated_webhook.status == OracleWebhookStatuses.pending.value
            assert updated_webhook.attempts == 1
