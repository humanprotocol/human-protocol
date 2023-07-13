from fastapi.testclient import TestClient


def test_greet_route(client: TestClient) -> None:
    response = client.get(f"/")
    assert response.status_code == 200
