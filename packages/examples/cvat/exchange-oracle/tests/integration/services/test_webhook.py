import unittest
import uuid

from sqlalchemy.exc import IntegrityError

import src.services.webhook as webhook_service
from src.core.oracle_events import ExchangeOracleEvent_TaskFinished
from src.core.types import (
    ExchangeOracleEventType,
    JobLauncherEventType,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    RecordingOracleEventType,
)
from src.db import SessionLocal
from src.models.webhook import Webhook


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_create_incoming_webhook(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value
        signature = "signature"

        webhook_id = webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.attempts, 0)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.event_type, JobLauncherEventType.escrow_created.value)
        self.assertEqual(webhook.event_data, None)
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)

    def test_create_incoming_webhook_none_escrow_address(self):
        chain_id = Networks.localhost.value
        signature = "signature"
        webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=None,
            chain_id=chain_id,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_incoming_webhook_none_chain_id(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        signature = "signature"
        webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=None,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_incoming_webhook_none_event_type(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        signature = "signature"
        with self.assertRaises(AssertionError) as error:
            webhook_service.inbox.create_webhook(
                self.session,
                escrow_address=escrow_address,
                chain_id=None,
                signature=signature,
                type=OracleWebhookTypes.job_launcher,
            )
        self.assertEqual(
            str(error.exception),
            "'event' and 'event_type' cannot be used together. Please use only one of the fields",
        )

    def test_create_incoming_webhook_none_signature(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value

        with self.assertRaises(ValueError) as error:
            webhook_service.inbox.create_webhook(
                self.session,
                escrow_address=escrow_address,
                chain_id=chain_id,
                type=OracleWebhookTypes.job_launcher,
                event_type=JobLauncherEventType.escrow_created.value,
            )
        self.assertEqual(
            str(error.exception), "Webhook signature must be specified for incoming events"
        )

    def test_create_outgoing_webhook(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value

        webhook_id = webhook_service.outbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle,
            event=ExchangeOracleEvent_TaskFinished(),
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 0)
        self.assertEqual(webhook.type, OracleWebhookTypes.exchange_oracle.value)
        self.assertEqual(webhook.event_type, ExchangeOracleEventType.task_finished.value)
        self.assertEqual(webhook.event_data, {})
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)

    def test_create_outgoing_webhook_none_escrow_address(self):
        chain_id = Networks.localhost.value
        webhook_service.outbox.create_webhook(
            self.session,
            escrow_address=None,
            chain_id=chain_id,
            type=OracleWebhookTypes.exchange_oracle,
            event=ExchangeOracleEvent_TaskFinished(),
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()

    def test_create_outgoing_webhook_none_chain_id(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        webhook_service.outbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=None,
            type=OracleWebhookTypes.exchange_oracle,
            event=ExchangeOracleEvent_TaskFinished(),
        )
        with self.assertRaises(IntegrityError) as error:
            self.session.commit()

    def test_create_outgoing_webhook_none_event_type(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        with self.assertRaises(AssertionError) as error:
            webhook_service.outbox.create_webhook(
                self.session,
                escrow_address=escrow_address,
                chain_id=None,
                type=OracleWebhookTypes.exchange_oracle,
            )
        self.assertEqual(
            str(error.exception),
            "'event' and 'event_type' cannot be used together. Please use only one of the fields",
        )

    def test_create_outgoing_webhook_with_signature(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value
        signature = "signature"

        with self.assertRaises(ValueError) as error:
            webhook_service.outbox.create_webhook(
                self.session,
                escrow_address=escrow_address,
                chain_id=chain_id,
                type=OracleWebhookTypes.exchange_oracle,
                event=ExchangeOracleEvent_TaskFinished(),
                signature=signature,
            )
        self.assertEqual(
            str(error.exception), "Webhook signature must not be specified for outgoing events"
        )

    def test_get_pending_webhooks(self):
        chain_id = Networks.localhost.value

        webhook1_id = str(uuid.uuid4())
        webhook1 = Webhook(
            id=webhook1_id,
            signature="signature1",
            escrow_address="0x1234567890123456789012345678901234567890",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=webhook_service.OracleWebhookDirectionTag.incoming,
        )
        webhook2_id = str(uuid.uuid4())
        webhook2 = Webhook(
            id=webhook2_id,
            signature="signature2",
            escrow_address="0x1234567890123456789012345678901234567891",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=webhook_service.OracleWebhookDirectionTag.incoming,
        )
        webhook3_id = str(uuid.uuid4())
        webhook3 = Webhook(
            id=webhook3_id,
            signature="signature3",
            escrow_address="0x1234567890123456789012345678901234567892",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.completed.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=webhook_service.OracleWebhookDirectionTag.incoming,
        )

        webhook4_id = str(uuid.uuid4())
        webhook4 = Webhook(
            id=webhook4_id,
            signature="signature4",
            escrow_address="0x1234567890123456789012345678901234567893",
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventType.task_completed.value,
            direction=webhook_service.OracleWebhookDirectionTag.incoming,
        )
        webhook5_id = str(uuid.uuid4())
        webhook5 = Webhook(
            id=webhook5_id,
            escrow_address="0x1234567890123456789012345678901234567894",
            chain_id=chain_id,
            type=OracleWebhookTypes.job_launcher.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=JobLauncherEventType.escrow_created.value,
            direction=webhook_service.OracleWebhookDirectionTag.outgoing,
        )

        self.session.add(webhook1)
        self.session.add(webhook2)
        self.session.add(webhook3)
        self.session.add(webhook4)
        self.session.add(webhook5)
        self.session.commit()

        pending_webhooks = webhook_service.inbox.get_pending_webhooks(
            self.session, type=OracleWebhookTypes.job_launcher, limit=10
        )
        self.assertEqual(len(pending_webhooks), 2)
        self.assertEqual(pending_webhooks[0].id, webhook1_id)
        self.assertEqual(pending_webhooks[1].id, webhook2_id)

        pending_webhooks = webhook_service.inbox.get_pending_webhooks(
            self.session, type=OracleWebhookTypes.recording_oracle, limit=10
        )
        self.assertEqual(len(pending_webhooks), 1)
        self.assertEqual(pending_webhooks[0].id, webhook4_id)

        pending_webhooks = webhook_service.outbox.get_pending_webhooks(
            self.session, type=OracleWebhookTypes.job_launcher, limit=10
        )
        self.assertEqual(len(pending_webhooks), 1)
        self.assertEqual(pending_webhooks[0].id, webhook5_id)

    def test_update_webhook_status(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value
        signature = "signature"

        webhook_id = webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )

        webhook_service.inbox.update_webhook_status(
            self.session, webhook_id, OracleWebhookStatuses.completed
        )

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 0)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.completed.value)

    def test_handle_webhook_success(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value
        signature = "signature"

        webhook_id = webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )

        webhook_service.inbox.handle_webhook_success(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 1)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.completed.value)

    def test_handle_webhook_fail(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        chain_id = Networks.localhost.value
        signature = "signature"

        webhook_id = webhook_service.inbox.create_webhook(
            self.session,
            escrow_address=escrow_address,
            chain_id=chain_id,
            signature=signature,
            type=OracleWebhookTypes.job_launcher,
            event_type=JobLauncherEventType.escrow_created.value,
        )

        webhook_service.inbox.handle_webhook_fail(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 1)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.pending.value)

        for i in range(4):
            webhook_service.inbox.handle_webhook_fail(self.session, webhook_id)

        webhook = self.session.query(Webhook).filter_by(id=webhook_id).first()

        self.assertEqual(webhook.escrow_address, escrow_address)
        self.assertEqual(webhook.chain_id, chain_id)
        self.assertEqual(webhook.attempts, 5)
        self.assertEqual(webhook.signature, signature)
        self.assertEqual(webhook.type, OracleWebhookTypes.job_launcher.value)
        self.assertEqual(webhook.status, OracleWebhookStatuses.failed.value)
