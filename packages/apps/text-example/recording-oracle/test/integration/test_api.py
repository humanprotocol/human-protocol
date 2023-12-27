import unittest
from http import HTTPStatus
from unittest.mock import patch, MagicMock

from starlette.testclient import TestClient

from src.config import Config
from src.db import engine, Base, Session, ResultsProcessingRequest, Statuses
from src.endpoints import Endpoints
from src.main import recording_oracle
from test.constants import EXCHANGE_ORACLE
from test.utils import random_address


class APITest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(recording_oracle)

        mock_escrow = MagicMock()
        mock_escrow.status = "Pending"
        mock_escrow.balance = 1
        mock_escrow.exchangeOracle = EXCHANGE_ORACLE.address
        self.escrow = mock_escrow

        self.escrow_address = random_address()
        self.chain_id = Config.localhost.chain_id
        self.webhook = {
            "escrow_address": self.escrow_address,
            "chain_id": self.chain_id,
            "solution_url": f"{Config.storage_config.endpoint_url}/{Config.storage_config.results_bucket_name}/raw_results.jsonl",
        }

        exchange_oracle = EXCHANGE_ORACLE
        self.signature = {"human-signature": exchange_oracle.sign(self.webhook)}

        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    @patch("human_protocol_sdk.escrow.EscrowUtils.get_escrow")
    def test_register_raw_results(self, mock_get_escrow: MagicMock):
        """When a valid request is posted:
        - a new pending ResultsProcessingRequest should be added to the database
        """
        mock_get_escrow.return_value = self.escrow

        response = self.client.post(
            Endpoints.WEBHOOK,
            json=self.webhook,
            headers=self.signature,
        )
        assert response.status_code == HTTPStatus.OK
        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)

        # check db status
        with Session() as session:
            job = session.query(ResultsProcessingRequest).one()

        assert job is not None
        assert job.status == Statuses.pending
        assert job.chain_id == self.chain_id
        assert job.escrow_address == self.escrow_address
