from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from human_protocol_sdk.constants import Status
from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV
from tests.utils.constants import (
    DEFAULT_GAS_PAYER as JOB_LAUNCHER,
    WEBHOOK_MESSAGE,
    WEBHOOK_MESSAGE_SIGNED,
    SIGNATURE,
)


class PolygonMumbaiConfig:
    chain_id = 80001
    rpc_api = "http://blockchain-node:8545/"
    private_key = DEFAULT_GAS_PAYER_PRIV


def test_incoming_webhook_200(client: TestClient) -> None:
    with patch("src.api.webhook.SessionLocal.begin") as mock_session_local, patch(
        "src.api.webhook.create_webhook"
    ) as mock_create_webhook, patch(
        "src.chain.escrow.get_web3"
    ) as mock_get_web3, patch(
        "src.chain.escrow.EscrowClient"
    ) as mock_escrow_client, patch(
        "src.chain.web3.Config.polygon_mumbai", PolygonMumbaiConfig
    ):
        mock_session = MagicMock()
        mock_session_local.return_value.__enter__.return_value = mock_session
        mock_create_webhook.return_value = "mocked_webhook_id"

        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 100
        mock_escrow_instance.get_status.return_value = Status.Pending
        mock_escrow_instance.get_job_launcher_address.return_value = JOB_LAUNCHER
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/job-launcher",
            headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
            json=WEBHOOK_MESSAGE,
        )

        assert response.status_code == 200
        assert response.json() == {"id": "mocked_webhook_id"}
        mock_get_web3.assert_called()
        mock_escrow_client.assert_called_with(mock_web3_instance)
        mock_escrow_instance.get_balance.assert_called_once_with(
            "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"
        )
        mock_escrow_instance.get_status.assert_called_once_with(
            "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"
        )
        mock_escrow_instance.get_job_launcher_address.assert_called_once_with(
            "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"
        )
        mock_session_local.assert_called_once()
        mock_create_webhook.assert_called_once_with(
            mock_session,
            WEBHOOK_MESSAGE["escrow_address"],
            WEBHOOK_MESSAGE["chain_id"],
            "job_launcher",
            WEBHOOK_MESSAGE_SIGNED,
        )


def test_incoming_webhook_400(client: TestClient) -> None:
    # Invalid Address
    data = {
        "escrow_address": "bad_address",
        "chain_id": 80001,
    }

    response = client.post(
        "/job-launcher",
        headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
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
        "escrow_address": "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6",
        "chain_id": 1234,
    }

    response = client.post(
        "/job-launcher",
        headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
        json=data,
    )

    assert response.status_code == 400
    assert response.json() == {
        "errors": [
            {
                "field": "chain_id",
                "message": "value is not a valid enumeration member; permitted: 137, 80001, 1338",
            }
        ]
    }

    # Invalid balance

    with patch("src.chain.escrow.get_web3") as mock_get_web3, patch(
        "src.chain.escrow.EscrowClient"
    ) as mock_escrow_client, patch(
        "src.chain.web3.Config.polygon_mumbai", PolygonMumbaiConfig
    ):
        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 0
        mock_escrow_instance.get_status.return_value = Status.Pending
        mock_escrow_instance.get_job_launcher_address.return_value = JOB_LAUNCHER
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/job-launcher",
            headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
            json=WEBHOOK_MESSAGE,
        )
        assert response.status_code == 400
        assert response.json() == {"message": "Escrow doesn't have funds"}

    # Invalid status

    with patch("src.chain.escrow.get_web3") as mock_get_web3, patch(
        "src.chain.escrow.EscrowClient"
    ) as mock_escrow_client, patch(
        "src.chain.web3.Config.polygon_mumbai", PolygonMumbaiConfig
    ):
        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 100
        mock_escrow_instance.get_status.return_value = Status.Complete
        mock_escrow_instance.get_job_launcher_address.return_value = JOB_LAUNCHER
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/job-launcher",
            headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
            json=WEBHOOK_MESSAGE,
        )
        assert response.status_code == 400
        assert response.json() == {
            "message": "Escrow is not in a Pending state. Current state: Complete"
        }

    # Invalid signature

    with patch("src.chain.escrow.get_web3") as mock_get_web3, patch(
        "src.chain.escrow.EscrowClient"
    ) as mock_escrow_client, patch(
        "src.chain.web3.Config.polygon_mumbai", PolygonMumbaiConfig
    ):
        mock_web3_instance = MagicMock()
        mock_get_web3.return_value = mock_web3_instance

        mock_escrow_instance = MagicMock()
        mock_escrow_instance.get_balance.return_value = 100
        mock_escrow_instance.get_status.return_value = Status.Complete
        mock_escrow_instance.get_job_launcher_address.return_value = JOB_LAUNCHER
        mock_escrow_client.return_value = mock_escrow_instance

        response = client.post(
            "/job-launcher",
            headers={"human-signature": SIGNATURE},
            json=WEBHOOK_MESSAGE,
        )
        assert response.status_code == 400
        assert response.json() == {
            "message": "Webhook sender address doesn't match. Expected: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, received: 0x44EA19Fbb88cF0884867F81BE0363A469cBEa9AE."
        }
