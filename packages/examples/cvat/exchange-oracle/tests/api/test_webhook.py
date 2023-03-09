from fastapi.testclient import TestClient


def test_incoming_webhook_200(client: TestClient) -> None:
    data = {
        "escrow_address": "0x651D3F1Ac7620eCEc0887200406de58b44854111",
        "network": "polygon_mumbai",
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
        "network": "polygon_mumbai",
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 400

    data = {
        "escrow_address": "0x651D3F1Ac7620eCEc0887200406de58b44854111",
        "network": "unsupported_network",
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 400
