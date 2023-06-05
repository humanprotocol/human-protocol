from fastapi.testclient import TestClient


def test_incoming_webhook_200(client: TestClient) -> None:
    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "network_id": 80001,
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 200


def test_incoming_webhook_400(client: TestClient) -> None:
    data = {
        "escrow_address": "bad_address",
        "network": 80001,
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 400

    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "network": 1370,
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 400
