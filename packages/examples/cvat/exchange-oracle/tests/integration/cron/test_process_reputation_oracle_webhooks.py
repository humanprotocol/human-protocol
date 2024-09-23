import uuid

import pytest
from cvat_sdk.api_client.exceptions import NotFoundException
from sqlalchemy import select

from src.core.storage import compose_data_bucket_prefix, compose_results_bucket_prefix
from src.core.types import (
    ExchangeOracleEventTypes,
    JobStatuses,
    Networks,
    OracleWebhookStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    ReputationOracleEventTypes,
    TaskStatuses,
    TaskTypes,
)
from src.crons.webhooks.reputation_oracle import process_incoming_reputation_oracle_webhooks
from src.cvat import api_calls
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task
from src.models.webhook import Webhook
from src.services import cloud
from src.services.cloud import StorageClient
from src.services.webhook import OracleWebhookDirectionTags
from src.utils.time import utcnow

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost


@pytest.fixture
def session():
    db_session = SessionLocal()
    yield db_session
    db_session.close()


@pytest.fixture
def create_project(session):
    cvat_id = 0

    def _create_project(status: ProjectStatuses) -> Project:
        nonlocal cvat_id
        cvat_id += 1
        project = Project(
            id=str(uuid.uuid4()),
            cvat_id=cvat_id,
            cvat_cloudstorage_id=1,
            status=status,
            job_type=TaskTypes.image_label_binary,
            escrow_address=escrow_address,
            chain_id=chain_id,
            bucket_url="https://test.storage.googleapis.com/",
        )
        session.add(project)
        session.commit()
        return project

    return _create_project


@pytest.fixture
def create_webhook(session):
    def _create_webhook(
        event_type: ReputationOracleEventTypes,
        direction: OracleWebhookDirectionTags,
        event_data: dict | None = None,
    ) -> Webhook:
        webhook = Webhook(
            id=str(uuid.uuid4()),
            signature="signature",
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=OracleWebhookTypes.reputation_oracle,
            status=OracleWebhookStatuses.pending,
            event_type=event_type,
            event_data=event_data or {},
            direction=direction,
        )
        session.add(webhook)
        session.commit()
        return webhook

    return _create_webhook


def mock_cloud_services(mocker):
    mock_storage_client = mocker.MagicMock(spec=StorageClient)
    mocker.patch.object(cloud, cloud.make_client.__name__, return_value=mock_storage_client)
    delete_project_mock = mocker.patch.object(api_calls, api_calls.delete_project.__name__)
    delete_cloudstorage_mock = mocker.patch.object(
        api_calls, api_calls.delete_cloudstorage.__name__
    )
    return mock_storage_client, delete_project_mock, delete_cloudstorage_mock


def add_cvat_entities(session, task_status: JobStatuses, job_status: TaskStatuses):
    task = Task(id=str(uuid.uuid4()), cvat_id=1, cvat_project_id=1, status=task_status)
    job = Job(
        id=str(uuid.uuid4()),
        cvat_id=1,
        cvat_project_id=1,
        cvat_task_id=task.cvat_id,
        status=job_status,
    )
    session.add_all([task, job])


@pytest.mark.parametrize(
    ("project_status", "expected_project_status"),
    [
        (ProjectStatuses.completed, ProjectStatuses.deleted),
        (ProjectStatuses.deleted, ProjectStatuses.deleted),
        (ProjectStatuses.annotation, ProjectStatuses.deleted),
    ],
)
def test_process_incoming_reputation_oracle_webhook_escrow_completed(
    session, create_project, create_webhook, mocker, project_status, expected_project_status
) -> None:
    project1 = create_project(project_status)
    project2 = create_project(project_status)

    add_cvat_entities(session, JobStatuses.completed, TaskStatuses.completed)

    webhook = create_webhook(
        ReputationOracleEventTypes.escrow_completed, OracleWebhookDirectionTags.incoming
    )
    mock_storage_client, delete_project_mock, delete_cloudstorage_mock = mock_cloud_services(mocker)

    process_incoming_reputation_oracle_webhooks()

    session.refresh(project1)
    session.refresh(project2)
    session.refresh(webhook)

    assert webhook.status == OracleWebhookStatuses.completed
    assert webhook.attempts == 1
    assert project1.status == expected_project_status
    assert mock_storage_client.remove_files.mock_calls == [
        mocker.call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
        mocker.call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
    ]
    assert delete_project_mock.mock_calls == [
        mocker.call(project1.cvat_id),
        mocker.call(project2.cvat_id),
    ]
    assert delete_cloudstorage_mock.mock_calls == [mocker.call(1)]

    outgoing_webhooks = list(
        session.scalars(
            select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
        )
    )
    assert len(outgoing_webhooks) == 1
    assert outgoing_webhooks[0].type == OracleWebhookTypes.recording_oracle
    assert outgoing_webhooks[0].event_type == ExchangeOracleEventTypes.escrow_cleaned


@pytest.mark.parametrize(
    ("project_status", "expected_project_status"),
    [
        (ProjectStatuses.completed, ProjectStatuses.deleted),
        (ProjectStatuses.deleted, ProjectStatuses.deleted),
        (ProjectStatuses.annotation, ProjectStatuses.deleted),
    ],
)
def test_process_incoming_reputation_oracle_webhooks_escrow_completed_exceptions(
    session, create_project, create_webhook, mocker, project_status, expected_project_status
) -> None:
    project1 = create_project(project_status)
    project2 = create_project(project_status)

    add_cvat_entities(session, JobStatuses.completed, TaskStatuses.completed)

    webhook = create_webhook(
        ReputationOracleEventTypes.escrow_completed, OracleWebhookDirectionTags.incoming
    )
    mock_storage_client, delete_project_mock, delete_cloudstorage_mock = mock_cloud_services(mocker)

    delete_project_mock.side_effect = [Exception, None]

    process_incoming_reputation_oracle_webhooks()

    session.refresh(project1)
    session.refresh(project2)
    session.refresh(webhook)

    assert webhook.status == OracleWebhookStatuses.pending
    assert webhook.attempts == 1
    assert project1.status == project_status

    assert mock_storage_client.remove_files.mock_calls == [
        mocker.call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
        mocker.call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
    ]
    assert delete_project_mock.mock_calls == [
        mocker.call(project1.cvat_id),
        mocker.call(project2.cvat_id),
    ]
    assert delete_cloudstorage_mock.mock_calls == [mocker.call(1)]

    outgoing_webhooks = list(
        session.scalars(
            select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
        )
    )
    assert len(outgoing_webhooks) == 0

    delete_project_mock.reset_mock()
    mock_storage_client.reset_mock()
    delete_project_mock.side_effect = [None, NotFoundException]
    delete_cloudstorage_mock.side_effect = NotFoundException
    webhook.wait_until = utcnow()
    session.commit()

    process_incoming_reputation_oracle_webhooks()

    assert webhook.status == OracleWebhookStatuses.completed
    assert webhook.attempts == 2

    assert project1.status == expected_project_status
    assert project2.status == expected_project_status

    assert mock_storage_client.remove_files.mock_calls == [
        mocker.call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
        mocker.call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
    ]
    assert delete_project_mock.mock_calls == [
        mocker.call(project1.cvat_id),
        mocker.call(project2.cvat_id),
    ]

    outgoing_webhooks = list(
        session.scalars(
            select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
        )
    )
    assert len(outgoing_webhooks) == 1
    assert outgoing_webhooks[0].type == OracleWebhookTypes.recording_oracle
    assert outgoing_webhooks[0].event_type == ExchangeOracleEventTypes.escrow_cleaned
