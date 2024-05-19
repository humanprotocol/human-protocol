from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from sqlalchemy.sql import select
from web3 import HTTPProvider, Web3

from src.core.types import JobLauncherEventTypes, Networks
from src.db import SessionLocal
from src.models.webhook import Webhook

from tests.utils.constants import DEFAULT_GAS_PAYER as JOB_LAUNCHER
from tests.utils.constants import RECORDING_ORACLE_ADDRESS, WEBHOOK_MESSAGE, WEBHOOK_MESSAGE_SIGNED

escrow_address = "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"


def test_incoming_webhook_200(client: TestClient) -> None:
    with (
        SessionLocal.begin() as session,
        patch("src.chain.web3.get_web3") as mock_get_web3,
        patch("src.chain.escrow.get_escrow") as mock_get_escrow,
    ):
        mock_get_web3.return_value = Web3(HTTPProvider(Networks.localhost))
        mock_escrow = Mock()
        mock_escrow.launcher = JOB_LAUNCHER
        mock_escrow.recording_oracle = RECORDING_ORACLE_ADDRESS
        mock_get_escrow.return_value = mock_escrow

        response = client.post(
            "/oracle-webhook",
            headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
            json=WEBHOOK_MESSAGE,
        )

        assert response.status_code == 200

        db_query = select(Webhook).where(Webhook.escrow_address == escrow_address)
        webhook = session.execute(db_query).scalars().first()
        assert response.json() == {"id": webhook.id}

        mock_get_web3.assert_called()
        mock_get_escrow.assert_called_with(
            WEBHOOK_MESSAGE["chain_id"],
            WEBHOOK_MESSAGE["escrow_address"],
        )
        assert webhook.escrow_address == escrow_address
        assert webhook.chain_id == 80002
        assert webhook.event_type == JobLauncherEventTypes.escrow_created.value
        assert webhook.event_data == {}
        assert webhook.direction == "incoming"
        assert webhook.signature == WEBHOOK_MESSAGE_SIGNED


def test_incoming_webhook_400_missing_field(client: TestClient) -> None:
    data = {
        "escrow_address": escrow_address,
        "chain_id": 80002,
    }

    response = client.post(
        "/oracle-webhook",
        headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
        json=data,
    )

    assert response.status_code == 400
    assert response.json() == {
        "errors": [
            {
                "field": "event_type",
                "message": "field required",
            }
        ]
    }


def test_incoming_webhook_400_invalid_address(client: TestClient) -> None:
    data = {
        "escrow_address": "bad_address",
        "chain_id": 1338,
        "event_type": "escrow_created",
    }

    response = client.post(
        "/oracle-webhook",
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


def test_incoming_webhook_400_invalid_chain_id(client: TestClient) -> None:
    data = {
        "escrow_address": "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6",
        "chain_id": 1234,
        "event_type": "escrow_created",
    }

    response = client.post(
        "/oracle-webhook",
        headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
        json=data,
    )

    assert response.status_code == 400
    assert response.json() == {
        "errors": [
            {
                "field": "chain_id",
                "message": "value is not a valid enumeration member; permitted: 137, 80002, 1338",
            }
        ]
    }


def test_incoming_webhook_401(client: TestClient) -> None:
    with (
        patch("src.chain.web3.get_web3") as mock_get_web3,
        patch("src.chain.escrow.get_escrow") as mock_get_escrow,
    ):
        mock_get_web3.return_value = Web3(HTTPProvider(Networks.localhost))
        mock_escrow = Mock()
        mock_escrow.launcher = escrow_address
        mock_escrow.recording_oracle = RECORDING_ORACLE_ADDRESS
        mock_get_escrow.return_value = mock_escrow
        response = client.post(
            "/oracle-webhook",
            headers={"human-signature": WEBHOOK_MESSAGE_SIGNED},
            json=WEBHOOK_MESSAGE,
        )
        assert response.status_code == 401
        assert response.json() == {"message": "Unauthorized"}
