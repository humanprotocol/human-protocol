from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.core.types import AssignmentStatuses, JobStatuses
from src.utils.time import utcnow

from tests.utils.constants import WALLET_ADDRESS1, WALLET_ADDRESS2
from tests.utils.setup_cvat import (
    add_assignment_to_db,
    add_cvat_job_to_db,
    add_cvat_project_to_db,
    add_cvat_task_to_db,
    generate_cvat_signature,
    get_cvat_job_from_db,
)

API_URL = "http://localhost:8080/api/"

PING_EVENT_DATA = {
    "event": "ping",
}


def test_ping_incoming_webhook(client: TestClient) -> None:
    # Should respond with 200 status to a "ping" event
    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": generate_cvat_signature(PING_EVENT_DATA)},
        json=PING_EVENT_DATA,
    )

    assert response.status_code == 200


def test_incoming_webhook_200(client: TestClient) -> None:
    # Create some entities in test DB
    add_cvat_project_to_db(cvat_id=1)
    add_cvat_task_to_db(cvat_id=1, cvat_project_id=1)

    # Payload for "create:job" event
    data = {
        "event": "create:job",
        "job": {
            "url": API_URL + "jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "new",
            "type": "annotation",
            "start_frame": 0,
            "stop_frame": 1,
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


@pytest.mark.parametrize("is_last_assignment", [True, False])
def test_incoming_webhook_can_update_expired_assignment(
    client: TestClient, is_last_assignment: bool
):
    # Check if an "update:job" event can update an expired assignment,
    # if the assignment is the last one for the job. Updates to other assignments should be ignored.

    add_cvat_project_to_db(cvat_id=1)
    add_cvat_task_to_db(cvat_id=1, cvat_project_id=1)
    job = add_cvat_job_to_db(
        cvat_id=1, cvat_task_id=1, cvat_project_id=1, status=JobStatuses.in_progress
    )

    user_cvat_id = 1
    add_assignment_to_db(WALLET_ADDRESS1, user_cvat_id, job.cvat_id, expires_at=utcnow())

    if not is_last_assignment:
        user_cvat_id += 1
        add_assignment_to_db(WALLET_ADDRESS2, user_cvat_id, job.cvat_id, expires_at=utcnow())

    data = {
        "event": "update:job",
        "job": {
            "url": API_URL + "jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "completed",
            "start_frame": 0,
            "stop_frame": 1,
            "assignee": {
                "url": API_URL + f"users/{user_cvat_id}",
                "id": user_cvat_id,
            },
            "updated_date": (utcnow() + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",
        },
        "before_update": {"state": "new", "assignee": None},
        "webhook_id": 1,
    }

    with patch("src.handlers.cvat_events.cvat_api.update_job_assignee") as mock_update_job_assignee:
        response = client.post(
            "/cvat-webhook",
            headers={"X-Signature-256": generate_cvat_signature(data)},
            json=data,
        )

    assert response.status_code == 200

    (job, assignments) = get_cvat_job_from_db(1)
    assert job.status == JobStatuses.new
    assert assignments[-1].status == AssignmentStatuses.expired
    mock_update_job_assignee.assert_called_once_with(job.cvat_id, assignee_id=None)

    if not is_last_assignment:
        for assignment in assignments[:-1]:
            assert assignment.status == AssignmentStatuses.created


@pytest.mark.parametrize("assignment_status", AssignmentStatuses)
def test_incoming_webhook_can_update_active_assignment(
    client: TestClient, assignment_status: AssignmentStatuses
):
    add_cvat_project_to_db(cvat_id=1)
    add_cvat_task_to_db(cvat_id=1, cvat_project_id=1)
    job = add_cvat_job_to_db(
        cvat_id=1, cvat_task_id=1, cvat_project_id=1, status=JobStatuses.in_progress
    )
    add_assignment_to_db(
        WALLET_ADDRESS1,
        1,
        job.cvat_id,
        status=assignment_status,
        expires_at=datetime.now()
        if assignment_status == AssignmentStatuses.expired
        else datetime.now() + timedelta(hours=1),
    )

    data = {
        "event": "update:job",
        "job": {
            "url": API_URL + "jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "state": "completed",
            "start_frame": 0,
            "stop_frame": 1,
            "assignee": {
                "url": API_URL + "users/1",
                "id": 1,
            },
            "updated_date": utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",
        },
        "before_update": {"state": "in_progress", "assignee": None},
        "webhook_id": 1,
    }

    with patch("src.handlers.cvat_events.cvat_api.update_job_assignee") as mock_update_job_assignee:
        response = client.post(
            "/cvat-webhook",
            headers={"X-Signature-256": generate_cvat_signature(data)},
            json=data,
        )

    assert response.status_code == 200

    (job, assignments) = get_cvat_job_from_db(1)
    if assignment_status == AssignmentStatuses.created:
        assert job.status == JobStatuses.completed
        assert assignments[0].status == AssignmentStatuses.completed
        mock_update_job_assignee.assert_called_once_with(job.cvat_id, assignee_id=None)
    else:
        assert job.status == JobStatuses.in_progress
        assert assignments[0].status == assignment_status
        mock_update_job_assignee.assert_not_called()


def test_incoming_webhook_401_bad_signature(client: TestClient) -> None:
    # Send a request with bad signature
    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": "dummy_signature"},
        json=PING_EVENT_DATA,
    )
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized"}


def test_incoming_webhook_401_without_signature(client: TestClient) -> None:
    response = client.post(
        "/cvat-webhook",
        json=PING_EVENT_DATA,
    )

    # Send a request without a signature
    assert response.status_code == 400
    assert response.json() == {
        "errors": [{"field": "x-signature-256", "message": "Field required"}]
    }
