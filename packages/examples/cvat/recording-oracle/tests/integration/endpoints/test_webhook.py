import random
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from src.chain.web3 import sign_message
from src.core.types import ExchangeOracleEventTypes, Networks
from src.db import SessionLocal
from src.endpoints.webhook import router
from src.models.webhook import Webhook

from tests.utils.constants import DEFAULT_GAS_PAYER


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        random.seed(42)
        self.session = SessionLocal()
        self.client = TestClient(router)
        self.mock_escrow = MagicMock()
        self.mock_escrow.exchange_oracle = DEFAULT_GAS_PAYER
        self.mock_escrow.status = "Pending"
        self.mock_escrow.balance = 1

    def tearDown(self):
        self.session.close()

    @patch("src.chain.escrow.get_escrow")
    def test_receive_oracle_webhook_client(self, mock_get_escrow):
        mock_get_escrow.return_value = self.mock_escrow

        escrow_address = "0x" + "".join([str(random.randint(0, 9)) for _ in range(40)])
        chain_id = Networks.localhost
        event_type = ExchangeOracleEventTypes.job_finished.value

        message = {
            "escrow_address": escrow_address,
            "chain_id": chain_id,
            "event_type": event_type,
            "event_data": {},
        }

        signed_message, _ = sign_message(chain_id, message)

        response = self.client.post(
            "/webhook", json=message, headers={"human-signature": signed_message}
        )

        assert response.status_code == 200
        response_body = response.json()
        webhook = self.session.query(Webhook).where(Webhook.id == response_body["id"]).one()
        assert webhook is not None
        assert webhook.escrow_address == escrow_address
        assert webhook.chain_id == chain_id
        assert webhook.event_type == event_type
