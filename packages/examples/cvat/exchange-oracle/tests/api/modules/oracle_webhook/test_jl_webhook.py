from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from human_protocol_sdk.constants import Status
from src.modules.api_schema import OracleWebhook


def test_incoming_webhook_200(client: TestClient) -> None:
    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "chain_id": 80001,
    }

    with patch("src.modules.api.SessionLocal.begin") as mock_session_local, patch(
        "src.modules.api.create_webhook"
    ) as mock_create_webhook, patch(
        "src.modules.chain.escrow.get_web3"
    ) as mock_get_web3, patch(
        "src.modules.chain.escrow.EscrowClient"
    ) as mock_escrow_client:
        mock_session = MagicMock()
        mock_session_local.return_value.__enter__.return_value = mock_session
        mock_create_webhook.return_value = "mocked_webhook_id"

        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 100
        mock_escrow_instance.get_status.return_value = Status.Pending
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/webhook/job-launcher",
            headers={"human-signature": "mocked signature"},
            json=data,
        )

        assert response.status_code == 200
        assert response.json() == {"id": "mocked_webhook_id"}
        mock_get_web3.assert_called_once()
        mock_escrow_client.assert_called_once_with(mock_web3_instance)
        mock_escrow_instance.get_balance.assert_called_once_with(
            "0xFE776895f6b00AA53969b20119a4777Ed920676a"
        )
        mock_escrow_instance.get_status.assert_called_once_with(
            "0xFE776895f6b00AA53969b20119a4777Ed920676a"
        )
        mock_session_local.assert_called_once()
        mock_create_webhook.assert_called_once_with(
            mock_session,
            data["escrow_address"],
            data["chain_id"],
            "job_launcher",
            "mocked signature",
        )


def test_incoming_webhook_400(client: TestClient) -> None:
    # Invalid Address
    data = {
        "escrow_address": "bad_address",
        "chain_id": 80001,
    }

    response = client.post(
        "/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )

    assert response.status_code == 400
    assert response.json() == {
        "errors": [
            {
                "field": "escrow_address",
                "message": "bad_address is not a correct Web3 address",
            }
        ]
    }

    # Invalid Chain Id
    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "chain_id": 1234,
    }

    response = client.post(
        "/webhook/job-launcher",
        headers={"human-signature": "mocked signature"},
        json=data,
    )

    assert response.status_code == 400
    assert response.json() == {
        "errors": [
            {
                "field": "chain_id",
                "message": "value is not a valid enumeration member; permitted: 137, 80001",
            }
        ]
    }

    # Invalid balance
    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "chain_id": 80001,
    }

    with patch("src.modules.chain.escrow.get_web3") as mock_get_web3, patch(
        "src.modules.chain.escrow.EscrowClient"
    ) as mock_escrow_client:
        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 0
        mock_escrow_instance.get_status.return_value = Status.Pending
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/webhook/job-launcher",
            headers={"human-signature": "mocked signature"},
            json=data,
        )
        assert response.status_code == 400
        assert response.json() == {"message": "Escrow doesn't have funds"}

    # Invalid status
    data = {
        "escrow_address": "0xFE776895f6b00AA53969b20119a4777Ed920676a",
        "chain_id": 80001,
    }

    with patch("src.modules.chain.escrow.get_web3") as mock_get_web3, patch(
        "src.modules.chain.escrow.EscrowClient"
    ) as mock_escrow_client:
        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 100
        mock_escrow_instance.get_status.return_value = Status.Complete
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/webhook/job-launcher",
            headers={"human-signature": "mocked signature"},
            json=data,
        )
        assert response.status_code == 400
        assert response.json() == {
            "message": "Escrow is not in a Pending state. Current state: Complete"
        }
