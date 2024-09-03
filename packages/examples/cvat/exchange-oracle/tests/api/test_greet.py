from fastapi.testclient import TestClient


def test_greet_route(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
