from datetime import timedelta

from fastapi.testclient import TestClient

from src.models.cvat import CvatWebhook
from src.utils.time import utcnow

from tests.utils.setup_cvat import (
    add_cvat_job_to_db,
    add_cvat_project_to_db,
    add_cvat_task_to_db,
    generate_cvat_signature,
    get_session,
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


def test_can_accept_incoming_job_update_webhook(client: TestClient) -> None:
    add_cvat_project_to_db(cvat_id=1)
    add_cvat_task_to_db(cvat_id=1, cvat_project_id=1)
    add_cvat_job_to_db(cvat_id=1, cvat_task_id=1, cvat_project_id=1)

    user_cvat_id = 1

    data = {
        "event": "update:job",
        "job": {
            "url": API_URL + "jobs/1",
            "id": 1,
            "type": "annotation",
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

    response = client.post(
        "/cvat-webhook",
        headers={"X-Signature-256": generate_cvat_signature(data)},
        json=data,
    )

    assert response.status_code == 200

    with get_session() as session:
        assert len(session.query(CvatWebhook).all()) == 1


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
