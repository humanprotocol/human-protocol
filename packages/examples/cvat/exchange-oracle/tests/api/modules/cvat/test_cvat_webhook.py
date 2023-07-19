from fastapi.testclient import TestClient
from tests.utils.setup_cvat import (
    generate_cvat_signature,
    add_cvat_project_to_db,
    add_cvat_task_to_db,
    get_cvat_job_from_db,
)


def test_incoming_webhook_200(client: TestClient) -> None:
    data = {
        "event": "ping",
    }
    signature = generate_cvat_signature(data)

    # Should respond with 200 status to a "ping" event
    response = client.post(
        "/webhook/cvat",
        headers={"X-Signature-256": signature},
        json=data,
    )

    assert response.status_code == 200

    # Create some entities in test DB
    project = add_cvat_project_to_db(cvat_id=1)
    task = add_cvat_task_to_db(cvat_id=1, cvat_project_id=1, status="annotation")

    # Payload for "create:job" event
    data = {
        "event": "create:job",
        "job": {
            "url": "http://localhost:8080/api/jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "assignee": None,
            "state": "new",
        },
        "webhook_id": 1,
    }

    signature = generate_cvat_signature(data)

    # Check if "create:job" event works correctly
    response = client.post(
        "/webhook/cvat",
        headers={"X-Signature-256": signature},
        json=data,
    )

    assert response.status_code == 200

    job = get_cvat_job_from_db(1)
    assert job.cvat_id == 1
    assert job.cvat_task_id == 1
    assert job.cvat_project_id == 1
    assert job.assignee == ""

    # Check if "update:job" event works correctly
    response = client.post(
        "/webhook/cvat",
        headers={"X-Signature-256": signature},
        json=data,
    )

    data = {
        "event": "update:job",
        "job": {
            "url": "http://localhost:8080/api/jobs/1",
            "id": 1,
            "task_id": 1,
            "project_id": 1,
            "assignee": {
                "url": "http://localhost:8080/api/users/1",
                "id": 1,
                "username": "admin",
            },
        },
        "before_update": {"assignee": None},
        "webhook_id": 1,
    }

    signature = generate_cvat_signature(data)

    # Check if "update:job" event works correctly
    response = client.post(
        "/webhook/cvat",
        headers={"X-Signature-256": signature},
        json=data,
    )

    assert response.status_code == 200

    job = get_cvat_job_from_db(1)
    assert job.assignee == "admin"


def test_incoming_webhook_403(client: TestClient) -> None:
    data = {
        "event": "ping",
    }

    # Send a request with bad signature
    response = client.post(
        "/webhook/cvat",
        headers={"X-Signature-256": "dummy_signature"},
        json=data,
    )

    assert response.status_code == 403
    assert response.json() == {"message": "Signature doesn't match"}

    response = client.post(
        "/webhook/cvat",
        json=data,
    )

    # Send a request without a signature
    assert response.status_code == 400
    assert response.json() == {
        "errors": [{"field": "x-signature-256", "message": "field required"}]
    }
