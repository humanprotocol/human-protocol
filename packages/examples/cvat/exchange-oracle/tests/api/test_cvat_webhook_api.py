from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.core.types import AssignmentStatus, JobStatuses

from tests.utils.setup_cvat import (
    add_asignment_to_db,
    add_cvat_project_to_db,
    add_cvat_task_to_db,
    generate_cvat_signature,
    get_cvat_job_from_db,
)


def test_incoming_webhook_200(client: TestClient) -> None:
    data = {
        "event": "ping",
    }
    signature = generate_cvat_signature(data)

    # Should respond with 200 status to a "ping" event
    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": signature},
        json=data,
    )

    assert response.status_code == 200

    # Create some entities in test DB
    add_cvat_project_to_db(cvat_id=1)
    add_cvat_task_to_db(cvat_id=1, cvat_project_id=1, status="annotation")

    # Payload for "create:job" event
    data = {
        "event": "create:job",
        "job": {
            "url": "http://localhost:8080/api/jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "new",
            "type": "annotation",
        },
        "webhook_id": 1,
    }

    signature = generate_cvat_signature(data)

    # Check if "create:job" event works correctly
    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": signature},
        json=data,
    )

    assert response.status_code == 200

    (job, _) = get_cvat_job_from_db(1)
    assert job.cvat_id == 1
    assert job.cvat_task_id == 1
    assert job.cvat_project_id == 1

    # Check if "update:job" event works with expired assignments
    wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
    add_asignment_to_db(wallet_address, 1, job.cvat_id, datetime.now())

    data = {
        "event": "update:job",
        "job": {
            "url": "http://localhost:8080/api/jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "completed",
            "assignee": {
                "url": "http://localhost:8080/api/users/1",
                "id": 1,
            },
            "updated_date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",
        },
        "before_update": {"state": "new", "assignee": None},
        "webhook_id": 1,
    }

    signature = generate_cvat_signature(data)

    # Check if "update:job" event works correctly

    with patch("src.handlers.cvat_events.cvat_api"):
        response = client.post(
            "/cvat-webhook",
            headers={"X-Signature-256": signature},
            json=data,
        )

    assert response.status_code == 200

    (job, asignees) = get_cvat_job_from_db(1)
    assert job.status == JobStatuses.new.value
    assert asignees[0].status == AssignmentStatus.expired.value

    # Check if "update:job" event works correctly
    wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
    add_asignment_to_db(wallet_address, 2, job.cvat_id, datetime.now() + timedelta(hours=1))

    data = {
        "event": "update:job",
        "job": {
            "url": "http://localhost:8080/api/jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "completed",
            "assignee": {
                "url": "http://localhost:8080/api/users/1",
                "id": 2,
            },
            "updated_date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",
        },
        "before_update": {"state": "new", "assignee": None},
        "webhook_id": 1,
    }

    signature = generate_cvat_signature(data)

    # Check if "update:job" event works correctly
    with patch("src.handlers.cvat_events.cvat_api"):
        response = client.post(
            "/cvat-webhook",
            headers={"X-Signature-256": signature},
            json=data,
        )

    assert response.status_code == 200

    (job, asignees) = get_cvat_job_from_db(1)
    assert job.status == JobStatuses.completed.value
    assert asignees[1].status == AssignmentStatus.completed.value


def test_incoming_webhook_401(client: TestClient) -> None:
    data = {
        "event": "ping",
    }

    # Send a request with bad signature
    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": "dummy_signature"},
        json=data,
    )

    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized"}

    response = client.post(
        "/cvat-webhook",
        json=data,
    )

    # Send a request without a signature
    assert response.status_code == 400
    assert response.json() == {
        "errors": [{"field": "x-signature-256", "message": "field required"}]
    }
