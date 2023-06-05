import unittest
import uuid

from pydantic import ValidationError
from src.db import SessionLocal
from src.constants import Networks
from src.modules.oracle_webhooks.constants import WebhookStatuses, WebhookTypes
from src.modules.oracle_webhooks.model import Webhook
from src.modules.oracle_webhooks.service import create_webhook, get_pending_webhooks
from src.modules.api_schema import JLWebhook
from sqlalchemy.exc import IntegrityError


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_webhook(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet
        signature = "signature"
        jl_webhook = JLWebhook(escrow_address=escrow_address, chain_id=chain_id)

        webhook_id = create_webhook(
            self.session, jl_webhook=jl_webhook, signature=signature
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, WebhookTypes.jl_webhook)
        self.assertEqual(webhook.status, WebhookStatuses.pending)

    def test_create_webhook_none_escrow_address(self):
        with self.assertRaises(ValidationError):
            JLWebhook(escrow_address=None, chain_id=Networks.polygon_mainnet)

    def test_create_webhook_none_network(self):
        with self.assertRaises(ValidationError):
            JLWebhook(
                escrow_address="0x1234567890123456789012345678901234567890",
                chain_id=None,
            )

    def test_create_webhook_none_signature(self):
        jl_webhook = JLWebhook(
            escrow_address="0x1234567890123456789012345678901234567890",
            chain_id=Networks.polygon_mainnet,
        )

        create_webhook(self.session, jl_webhook=jl_webhook, signature=None)
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_pending_webhooks(self):
        chain_id = Networks.polygon_mainnet

        webhook1_id = str(uuid.uuid4())
        webhook1 = Webhook(
            id=webhook1_id,
            signature="signature1",
            escrow_address="0x1234567890123456789012345678901234567890",
            chain_id=chain_id,
            type=WebhookTypes.jl_webhook,
            status=WebhookStatuses.pending,
        )
        webhook2_id = str(uuid.uuid4())
        webhook2 = Webhook(
            id=webhook2_id,
            signature="signature2",
            escrow_address="0x1234567890123456789012345678901234567891",
            chain_id=chain_id,
            type=WebhookTypes.jl_webhook,
            status=WebhookStatuses.pending,
        )
        webhook3_id = str(uuid.uuid4())
        webhook3 = Webhook(
            id=webhook3_id,
            signature="signature3",
            escrow_address="0x1234567890123456789012345678901234567892",
            chain_id=chain_id,
            type=WebhookTypes.jl_webhook,
            status=WebhookStatuses.completed,
        )

        self.session.add(webhook1)
        self.session.add(webhook2)
        self.session.add(webhook3)
        self.session.commit()

        pending_webhooks = get_pending_webhooks(self.session, 10)
        self.assertEqual(len(pending_webhooks), 2)
        self.assertEqual(pending_webhooks[0].id, webhook1_id)
        self.assertEqual(pending_webhooks[1].id, webhook2_id)

        pending_webhooks = get_pending_webhooks(self.session, 1)
        self.assertEqual(len(pending_webhooks), 1)
        self.assertEqual(pending_webhooks[0].id, webhook1_id)
