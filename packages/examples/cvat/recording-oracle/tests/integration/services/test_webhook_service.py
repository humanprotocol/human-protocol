import random
import unittest
import uuid

from sqlalchemy.exc import IntegrityError

from src.core.types import Networks, OracleWebhookStatuses, OracleWebhookTypes
from src.db import SessionLocal
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTags, inbox


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()
        self.webhook_kwargs = {
            "session": self.session,
            "escrow_address": "0x1234567890123456789012345678901234567890",
            "chain_id": Networks.polygon_mainnet.value,
            "type": OracleWebhookTypes.exchange_oracle,
            "signature": "signature",
            "event_type": "task_finished",
        }
        random.seed(42)

    def tearDown(self):
        self.session.close()

    def dummy_webhook(self, oracle_webhook_type: OracleWebhookTypes, status: OracleWebhookStatuses):
        address = "0x" + "".join([str(random.randint(0, 9)) for _ in range(40)])
        return Webhook(
            id=str(uuid.uuid4()),
            direction=OracleWebhookDirectionTags.incoming.value,
            signature=f"signature-{uuid.uuid4()}",
            escrow_address=address,
            chain_id=Networks.polygon_mainnet.value,
            type=oracle_webhook_type.value,
            status=status.value,
            event_type="task_finished",
        )

    def test_create_webhook(self):
        webhook_id = inbox.create_webhook(**self.webhook_kwargs)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        assert webhook.escrow_address == self.webhook_kwargs["escrow_address"]
        assert webhook.chain_id == self.webhook_kwargs["chain_id"]
        assert webhook.attempts == 0
        assert webhook.signature == self.webhook_kwargs["signature"]
        assert webhook.type == OracleWebhookTypes.exchange_oracle
        assert webhook.status == OracleWebhookStatuses.pending
        # TODO: check intended fields and verify those

    def _test_none_webhook_argument(self, argument_name, error_type):
        kwargs = dict(**self.webhook_kwargs)
        kwargs[argument_name] = None
        with self.assertRaises(error_type):
            inbox.create_webhook(**kwargs)
            self.session.commit()

    def test_create_webhook_none_escrow_address(self):
        self._test_none_webhook_argument("escrow_address", IntegrityError)

    def test_create_webhook_none_chain_id(self):
        self._test_none_webhook_argument("chain_id", IntegrityError)

    def test_create_webhook_none_signature(self):
        self._test_none_webhook_argument("signature", ValueError)

    def test_get_pending_webhooks(self):
        webhook1 = self.dummy_webhook(
            oracle_webhook_type=OracleWebhookTypes.exchange_oracle,
            status=OracleWebhookStatuses.pending,
        )
        webhook2 = self.dummy_webhook(
            oracle_webhook_type=OracleWebhookTypes.exchange_oracle,
            status=OracleWebhookStatuses.pending,
        )
        webhook3 = self.dummy_webhook(
            oracle_webhook_type=OracleWebhookTypes.exchange_oracle,
            status=OracleWebhookStatuses.completed,
        )
        webhook4 = self.dummy_webhook(
            oracle_webhook_type=OracleWebhookTypes.reputation_oracle,
            status=OracleWebhookStatuses.pending,
        )

        self.session.add(webhook1)
        self.session.add(webhook2)
        self.session.add(webhook3)
        self.session.add(webhook4)
        self.session.commit()

        pending_webhooks = inbox.get_pending_webhooks(
            self.session, OracleWebhookTypes.exchange_oracle
        )
        assert len(pending_webhooks) == 2
        assert pending_webhooks[0].id == webhook1.id
        assert pending_webhooks[1].id == webhook2.id

        pending_webhooks = inbox.get_pending_webhooks(
            self.session, OracleWebhookTypes.reputation_oracle
        )
        assert len(pending_webhooks) == 1
        assert pending_webhooks[0].id == webhook4.id

    def test_update_webhook_status(self):
        webhook_id = inbox.create_webhook(**self.webhook_kwargs)
        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()
        assert webhook.status == OracleWebhookStatuses.pending

        inbox.update_webhook_status(self.session, webhook_id, OracleWebhookStatuses.completed)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()
        assert webhook.status == OracleWebhookStatuses.completed

    def test_update_webhook_invalid_status(self):
        webhook_id = inbox.create_webhook(**self.webhook_kwargs)
        with self.assertRaises(AttributeError):
            inbox.update_webhook_status(self.session, webhook_id, "Invalid status")

    def test_handle_webhook_success(self):
        webhook_id = inbox.create_webhook(**self.webhook_kwargs)

        inbox.handle_webhook_success(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        assert webhook.attempts == 1
        assert webhook.status == OracleWebhookStatuses.completed.value

    def test_handle_webhook_fail(self):
        webhook_id = inbox.create_webhook(**self.webhook_kwargs)
        inbox.handle_webhook_fail(self.session, webhook_id)
        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        assert webhook.attempts == 1
        assert webhook.type == OracleWebhookTypes.exchange_oracle.value
        assert webhook.status == OracleWebhookStatuses.pending.value

        # assumes Config.webhook_max_retries == 5
        for _i in range(4):
            inbox.handle_webhook_fail(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        assert webhook.attempts == 5
        assert webhook.status == OracleWebhookStatuses.failed.value
