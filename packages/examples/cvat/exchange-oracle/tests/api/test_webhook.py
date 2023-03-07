from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_incoming_webhook(client: TestClient, db: Session) -> None:
    data = {
        "escrow_address": "0x651D3F1Ac7620eCEc0887200406de58b44854111",
        "s3_url": "https://some_mocked_url.com",
        "network": "1",
    }
    response = client.post(
        f"/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )
    assert response.status_code == 200
