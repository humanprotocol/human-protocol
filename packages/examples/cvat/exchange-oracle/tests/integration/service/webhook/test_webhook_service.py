import unittest
import uuid

from pydantic import ValidationError
from src.db import SessionLocal
from src.constants import Networks
from src.modules.oracle_webhook.constants import (
    OracleWebhookTypes,
    OracleWebhookStatuses,
)
from src.modules.oracle_webhook.model import Webhook
from sqlalchemy.exc import IntegrityError

from src.modules.oracle_webhook.constants import (
    OracleWebhookTypes,
    OracleWebhookStatuses,
)
from src.modules.oracle_webhook import service as webhook_service


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_webhook(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"

        webhook_id = webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 0)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)

    def test_create_webhook_none_escrow_address(self):
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"
        webhook_service.create_webhook(
            self.session,
            escrow_address=None,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_webhook_none_chain_id(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        signature = "signature"
        webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=None,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_webhook_none_signature(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value

        webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=None,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_get_pending_webhooks(self):
        chain_id = Networks.polygon_mainnet.value

        webhook1_id = str(uuid.uuid4())
        webhook1 = Webhook(
            id=webhook1_id,
            signature="signature1",
            escrow_address="0x1234567890123456789012345678901234567890",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )
        webhook2_id = str(uuid.uuid4())
        webhook2 = Webhook(
            id=webhook2_id,
            signature="signature2",
            escrow_address="0x1234567890123456789012345678901234567891",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
        )
        webhook3_id = str(uuid.uuid4())
        webhook3 = Webhook(
            id=webhook3_id,
            signature="signature3",
            escrow_address="0x1234567890123456789012345678901234567892",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.completed.value,
        )

        webhook4_id = str(uuid.uuid4())
        webhook4 = Webhook(
            id=webhook4_id,
            signature="signature4",
            escrow_address="0x1234567890123456789012345678901234567892",
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
        )

        self.session.add(webhook1)
        self.session.add(webhook2)
        self.session.add(webhook3)
        self.session.add(webhook4)
        self.session.commit()

        pending_webhooks = webhook_service.get_pending_webhooks(
            self.session, OracleWebhookTypes.job_launcher.value, 10
        )
        self.assertEqual(len(pending_webhooks), 2)
        self.assertEqual(pending_webhooks[0].id, webhook1_id)
        self.assertEqual(pending_webhooks[1].id, webhook2_id)

        pending_webhooks = webhook_service.get_pending_webhooks(
            self.session, OracleWebhookTypes.recording_oracle.value, 10
        )
        self.assertEqual(len(pending_webhooks), 1)
        self.assertEqual(pending_webhooks[0].id, webhook4_id)

    def test_update_webhook_status(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"

        webhook_id = webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )

        webhook_service.update_webhook_status(
            self.session, webhook_id, OracleWebhookStatuses.completed.value
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 0)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.completed.value)

    def test_update_webhook_invalid_status(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"

        webhook_id = webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )

        with self.assertRaises(ValueError):
            webhook_service.update_webhook_status(
                self.session, webhook_id, "Invalid status"
            )

    def test_handle_webhook_success(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"

        webhook_id = webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )

        webhook_service.handle_webhook_success(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 1)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.completed.value)

    def test_handle_webhook_fail(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.polygon_mainnet.value
        signature = "signature"

        webhook_id = webhook_service.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            signature=signature,
        )

        webhook_service.handle_webhook_fail(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 1)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)

        for i in range(4):
            webhook_service.handle_webhook_fail(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 5)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.failed.value)
