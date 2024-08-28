import uuid
from dataclasses import dataclass

import pytest
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
from src.crons.webhooks.reputation_oracle import (
    process_incoming_reputation_oracle_webhooks,
)
from src.cvat import api_calls
from src.db import SessionLocal
from src.models.cvat import Job, Project, Task
from src.models.webhook import Webhook
from src.services import cloud
from src.services.cloud import StorageClient
from src.services.webhook import OracleWebhookDirectionTags

escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
chain_id = Networks.localhost


@pytest.fixture
def session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def create_project(session):
    cvat_id = 0

    def _create_project(status):
        nonlocal cvat_id
        cvat_id += 1
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
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
    def _create_webhook(event_type, direction, event_data=None):
        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
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


@dataclass
class Case:
    project_status: ProjectStatuses
    task_status: TaskStatuses
    job_status: JobStatuses
    expected_project_status: ProjectStatuses
    expected_task_status: TaskStatuses
    expected_job_status: JobStatuses


@pytest.mark.parametrize(
    "case",
    [
        Case(
            project_status=ProjectStatuses.completed,
            task_status=TaskStatuses.completed,
            job_status=JobStatuses.completed,
            expected_project_status=ProjectStatuses.deleted,
            expected_task_status=TaskStatuses.deleted,
            expected_job_status=JobStatuses.deleted,
        ),
        Case(
            project_status=ProjectStatuses.deleted,
            task_status=TaskStatuses.deleted,
            job_status=JobStatuses.deleted,
            expected_project_status=ProjectStatuses.deleted,
            expected_task_status=TaskStatuses.deleted,
            expected_job_status=JobStatuses.deleted,
        ),
        Case(
            project_status=ProjectStatuses.annotation,
            task_status=TaskStatuses.annotation,
            job_status=JobStatuses.in_progress,
            expected_project_status=ProjectStatuses.deleted,
            expected_task_status=TaskStatuses.deleted,
            expected_job_status=JobStatuses.deleted,
        ),
    ],
    ids=["completed", "finished", "in progress"],
)
def test_process_incoming_reputation_oracle_webhooks_task_rejected_type(
    *,
    session,
    create_project,
    create_webhook,
    mocker,
    case,
) -> None:
    project = create_project(case.project_status)
    project2 = create_project(case.project_status)

    cvat_task = Task(id=str(uuid.uuid4()), cvat_id=1, cvat_project_id=1, status=case.task_status)
    cvat_job = Job(
        id=str(uuid.uuid4()),
        cvat_id=1,
        cvat_project_id=1,
        cvat_task_id=cvat_task.cvat_id,
        status=case.job_status,
    )
    session.add(cvat_task)
    session.add(cvat_job)

    webhook = create_webhook(
        ReputationOracleEventTypes.escrow_completed, OracleWebhookDirectionTags.incoming
    )
    mock_storage_client = mocker.MagicMock(spec=StorageClient)
    mocker.patch.object(cloud, cloud.make_client.__name__, return_value=mock_storage_client)
    mock_storage_client.list_files.side_effect = [
        ["file1", "file2"],
        ["results/file3", "results/file4"],
    ]
    delete_project_mock = mocker.patch.object(api_calls, api_calls.delete_project.__name__)
    delete_cloudstorage_mock = mocker.patch.object(
        api_calls, api_calls.delete_cloudstorage.__name__
    )
    # Code under test
    process_incoming_reputation_oracle_webhooks()

    session.refresh(project)
    session.refresh(project2)
    session.refresh(webhook)

    assert webhook.status == OracleWebhookStatuses.completed
    assert webhook.attempts == 1

    assert project.status == case.expected_project_status
    assert project.tasks[0].status == case.expected_task_status
    assert project.jobs[0].status == case.expected_job_status

    assert mock_storage_client.list_files.mock_calls == [
        mocker.call(prefix=compose_data_bucket_prefix(escrow_address, chain_id)),
        mocker.call(prefix=compose_results_bucket_prefix(escrow_address, chain_id)),
    ]
    assert mock_storage_client.remove_files.mock_calls == [
        mocker.call(["file1", "file2", "results/file3", "results/file4"]),
    ]

    assert delete_project_mock.mock_calls == [
        mocker.call(project.cvat_id),
        mocker.call(project2.cvat_id),
    ]
    assert delete_cloudstorage_mock.mock_calls == [mocker.call(1)]

    outgoing_webhooks: list[Webhook] = list(
        session.scalars(
            select(Webhook).where(Webhook.direction == OracleWebhookDirectionTags.outgoing)
        )
    )
    assert len(outgoing_webhooks) == 1
    outgoing_webhook = outgoing_webhooks[0]

    assert outgoing_webhook.type == OracleWebhookTypes.recording_oracle
    assert outgoing_webhook.event_type == ExchangeOracleEventTypes.escrow_cleaned
