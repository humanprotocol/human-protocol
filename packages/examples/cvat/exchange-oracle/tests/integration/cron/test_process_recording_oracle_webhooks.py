import unittest
import uuid
from datetime import timedelta
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.constants import ChainId
from sqlalchemy.sql import select

from src.core.types import (
    AssignmentStatuses,
    EscrowValidationStatuses,
    ExchangeOracleEventTypes,
    JobStatuses,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    RecordingOracleEventTypes,
    TaskStatuses,
    TaskTypes,
)
from src.crons.webhooks.recording_oracle import (
    process_incoming_recording_oracle_webhooks,
    process_outgoing_recording_oracle_webhooks,
)
from src.db import SessionLocal
from src.models.cvat import Assignment, EscrowValidation, Job, Project, Task, User
from src.models.webhook import Webhook
from src.services.webhook import OracleWebhookDirectionTags
from src.utils.time import utcnow

from tests.utils.constants import DEFAULT_MANIFEST_URL, RECORDING_ORACLE_ADDRESS
from tests.utils.db_helper import create_project_task_and_job

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_process_incoming_recording_oracle_webhooks_job_completed_type(self):
        user = User(
            wallet_address="sample_wallet",
            cvat_id=1,
            cvat_email="email@sample.com",
        )
        self.session.add(user)

        project_creation_time = utcnow() - timedelta(days=1)
        project_completion_time = project_creation_time + timedelta(hours=10)

        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, escrow_address, 1
        )
        cvat_project.status = ProjectStatuses.validation
        cvat_project.created_at = project_creation_time
        cvat_project.updated_at = project_completion_time
        self.session.add(cvat_project)

        cvat_task.status = TaskStatuses.completed
        cvat_task.created_at = project_creation_time
        cvat_task.updated_at = project_completion_time
        self.session.add(cvat_task)

        cvat_job.status = JobStatuses.completed
        cvat_job.created_at = project_creation_time
        cvat_job.updated_at = project_completion_time
        self.session.add(cvat_job)

        cvat_assignment1 = Assignment(
            id=str(uuid.uuid4()),
            created_at=project_creation_time,
            updated_at=project_creation_time + timedelta(hours=1),
            expires_at=project_creation_time + timedelta(hours=1),
            user_wallet_address=user.wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            status=AssignmentStatuses.expired,
        )
        self.session.add(cvat_assignment1)

        cvat_assignment2 = Assignment(
            id=str(uuid.uuid4()),
            created_at=project_creation_time + timedelta(minutes=5),
            updated_at=project_completion_time,
            expires_at=project_creation_time + timedelta(minutes=5) + timedelta(hours=1),
            user_wallet_address=user.wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            status=AssignmentStatuses.completed,
        )
        self.session.add(cvat_assignment2)

        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.job_completed.value,
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.in_progress,
        )
        self.session.add(validation)

        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        db_webhook = self.session.query(Webhook).get(webhook_id)
        assert db_webhook.status == OracleWebhookStatuses.completed.value
        assert db_webhook.attempts == 1

        db_project = self.session.query(Project).get(cvat_project.id)
        assert db_project.status == ProjectStatuses.recorded.value
        assert db_project.updated_at > project_completion_time

        db_task = self.session.query(Task).get(cvat_task.id)
        assert db_task.updated_at > project_completion_time

        db_job = self.session.query(Job).get(cvat_job.id)
        assert db_job.updated_at > project_completion_time

        db_assignment1 = self.session.query(Assignment).get(cvat_assignment1.id)
        assert db_assignment1.updated_at < project_completion_time

        db_assignment2 = self.session.query(Assignment).get(cvat_assignment2.id)
        assert db_assignment2.updated_at > project_completion_time

        db_validation = self.session.query(EscrowValidation).get(validation_id)
        assert db_validation.status == EscrowValidationStatuses.completed

    def test_process_incoming_recording_oracle_webhooks_job_completed_type_invalid_escrow_status(
        self,
    ):
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=1,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.completed.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.job_completed.value,
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.awaiting,
        )
        self.session.add(validation)

        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        db_webhook = self.session.query(Webhook).get(webhook_id)
        assert db_webhook.status == OracleWebhookStatuses.completed.value
        assert db_webhook.attempts == 1

        db_project = self.session.query(Project).get(project_id)
        assert db_project.status == ProjectStatuses.completed.value

        db_validation = self.session.query(EscrowValidation).get(validation_id)
        assert db_validation.status == EscrowValidationStatuses.awaiting

    def test_process_incoming_recording_oracle_webhooks_submission_rejected_type(self):
        cvat_id = 1

        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)
        task_id = str(uuid.uuid4())
        cvat_task = Task(
            id=task_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            status=TaskStatuses.completed.value,
        )
        self.session.add(cvat_task)

        job_id = str(uuid.uuid4())
        cvat_job = Job(
            id=job_id,
            cvat_id=cvat_id,
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            status=JobStatuses.completed,
            start_frame=0,
            stop_frame=1,
        )
        self.session.add(cvat_job)

        user_wallet = "sample wallet"
        user = User(
            wallet_address=user_wallet,
            cvat_email="example@example.com",
            cvat_id=42,
        )
        self.session.add(user)

        assignment_id = str(uuid.uuid4())
        assignment = Assignment(
            id=assignment_id,
            created_at=utcnow() - timedelta(minutes=10),
            completed_at=utcnow() - timedelta(minutes=2),
            expires_at=utcnow() + timedelta(minutes=5),
            user_wallet_address="sample wallet",
            cvat_job_id=cvat_id,
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.submission_rejected.value,
            event_data={
                "assignments": [{"assignment_id": assignment_id, "reason": "sample reason"}]
            },
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.in_progress,
        )
        self.session.add(validation)

        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        db_webhook = self.session.query(Webhook).get(webhook_id)
        assert db_webhook.status == OracleWebhookStatuses.completed.value
        assert db_webhook.attempts == 1

        db_project = self.session.query(Project).get(project_id)
        assert db_project.status == ProjectStatuses.annotation.value

        db_task = self.session.query(Task).get(task_id)
        assert db_task.status == TaskStatuses.annotation.value

        db_job = self.session.query(Job).get(job_id)
        assert db_job.status == JobStatuses.new.value

        db_assignment = self.session.query(Assignment).get(assignment_id)
        assert db_assignment.status == AssignmentStatuses.rejected

        db_validation = self.session.query(EscrowValidation).get(validation_id)
        assert db_validation.status == EscrowValidationStatuses.completed

    def test_process_incoming_recording_oracle_webhooks_submission_rejected_type_invalid_project_status(  # noqa: E501
        self,
    ):
        cvat_id = 1

        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.annotation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.submission_rejected.value,
            event_data={
                "assignments": [{"assignment_id": str(uuid.uuid4()), "reason": "sample reason"}]
            },
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.in_progress,
        )
        self.session.add(validation)

        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        db_webhook = self.session.query(Webhook).get(webhook_id)
        assert db_webhook.status == OracleWebhookStatuses.completed.value
        assert db_webhook.attempts == 1

        db_project = self.session.query(Project).get(project_id)
        assert db_project.status == ProjectStatuses.annotation.value

        db_validation = self.session.query(EscrowValidation).get(validation_id)
        assert db_validation.status == EscrowValidationStatuses.completed

    def test_process_incoming_recording_oracle_webhooks_submission_rejected_type_invalid_escrow_status(  # noqa: E501
        self,
    ):
        cvat_id = 1

        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation.value,
            job_type=TaskTypes.image_label_binary.value,
            escrow_address=escrow_address,
            chain_id=Networks.localhost.value,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.submission_rejected.value,
            event_data={
                "assignments": [{"assignment_id": str(uuid.uuid4()), "reason": "sample reason"}]
            },
            direction=OracleWebhookDirectionTags.incoming,
        )
        self.session.add(webhook)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.awaiting,
        )
        self.session.add(validation)

        self.session.commit()

        process_incoming_recording_oracle_webhooks()

        db_webhook = self.session.query(Webhook).get(webhook_id)
        assert db_webhook.status == OracleWebhookStatuses.completed.value
        assert db_webhook.attempts == 1

        db_project = self.session.query(Project).get(project_id)
        assert db_project.status == ProjectStatuses.validation.value

        db_validation = self.session.query(EscrowValidation).get(validation_id)
        assert db_validation.status == EscrowValidationStatuses.awaiting

    def test_process_outgoing_recording_oracle_webhooks(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=ExchangeOracleEventTypes.job_finished.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()
        with (
            patch("src.chain.kvstore.get_escrow") as mock_escrow,
            patch("src.chain.kvstore.OperatorUtils.get_leader") as mock_leader,
            patch("httpx.Client.post") as mock_httpx_post,
        ):
            w3 = Mock()
            w3.eth.chain_id = ChainId.LOCALHOST.value
            mock_escrow_data = Mock()
            mock_escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = mock_escrow_data
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_httpx_post.return_value = mock_response

            process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.completed.value
        assert updated_webhook.attempts == 1
        mock_httpx_post.assert_called_once()

    def test_process_outgoing_recording_oracle_webhooks_invalid_type(self):
        chain_id = Networks.localhost.value

        webhok_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhok_id,
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.recording_oracle.value,
            status=OracleWebhookStatuses.pending.value,
            event_type=RecordingOracleEventTypes.job_completed.value,
            direction=OracleWebhookDirectionTags.outgoing,
        )

        self.session.add(webhook)
        self.session.commit()

        process_outgoing_recording_oracle_webhooks()

        updated_webhook = (
            self.session.execute(select(Webhook).where(Webhook.id == webhok_id)).scalars().first()
        )

        assert updated_webhook.status == OracleWebhookStatuses.pending.value
        assert updated_webhook.attempts == 1
