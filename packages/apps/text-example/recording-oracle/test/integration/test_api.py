import unittest
from http import HTTPStatus
from unittest.mock import patch, MagicMock

from starlette.testclient import TestClient

from src.config import Config
from src.db import engine, Base, Session, ResultsProcessingRequest, Statuses
from src.endpoints import Endpoints, Errors
from src.main import recording_oracle
from test.constants import EXCHANGE_ORACLE
from test.utils import (
    random_address,
    assert_http_error_response,
    assert_no_entries_in_db,
)

get_escrow_path = "human_protocol_sdk.escrow.EscrowUtils.get_escrow"


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

    @patch(get_escrow_path)
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
        mock_get_escrow.assert_called_once()

        # check db status
        with Session() as session:
            job = session.query(ResultsProcessingRequest).one()

        assert job is not None
        assert job.status == Statuses.pending
        assert job.chain_id == self.chain_id
        assert job.escrow_address == self.escrow_address

    def test_register_raw_results_failing_due_to_invalid_payload(self):
        """When the webhook is called with an invalid payload:
        - an appropriate error response should be returned
        - NO request should be added to the database.
        """
        webhook = self.webhook.copy()
        webhook["chain_id"] = -4

        response = self.client.post(
            Endpoints.WEBHOOK,
            json=webhook,
            headers=self.signature,
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)
        assert_no_entries_in_db(ResultsProcessingRequest)

        webhook["chain_id"] = 4

        response = self.client.post(
            Endpoints.WEBHOOK,
            json=webhook,
            headers=self.signature,
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)
        assert_no_entries_in_db(ResultsProcessingRequest)

    @patch(get_escrow_path)
    def test_register_raw_results_failing_due_to_missing_escrow(
        self, mock_get_escrow: MagicMock
    ):
        """When the webhook is called with a payload pointing to no escrow:
        - an appropriate error response should be returned
        - NO request should be added to the database.
        """
        mock_get_escrow.return_value = None

        response = self.client.post(
            Endpoints.WEBHOOK,
            json=self.webhook,
            headers=self.signature,
        )

        assert_http_error_response(response, Errors.ESCROW_NOT_FOUND)
        mock_get_escrow.assert_called_once()
        assert_no_entries_in_db(ResultsProcessingRequest)

    @patch(get_escrow_path)
    def test_register_raw_results_failing_due_to_invalid_escrow(
        self, mock_get_escrow: MagicMock
    ):
        """When the webhook is called with a payload pointing to an invalid escrow:
        - an appropriate error response should be returned
        - NO request should be added to the database.
        """
        # insufficient funds
        mock_escrow = MagicMock()
        mock_escrow.balance = 0
        mock_escrow.status = "Pending"
        mock_get_escrow.return_value = mock_escrow

        response = self.client.post(
            Endpoints.WEBHOOK,
            json=self.webhook,
            headers=self.signature,
        )

        assert_http_error_response(response, Errors.ESCROW_VALIDATION_FAILED)
        assert_no_entries_in_db(ResultsProcessingRequest)
        mock_get_escrow.assert_called_once()

    @patch(get_escrow_path)
    def test_register_raw_results_failing_due_to_invalid_signature(
        self, mock_get_escrow: MagicMock
    ):
        """When the webhook is called with an invalid signature header:
        - an appropriate error response should be returned
        - NO request should be added to the database.
        """
        mock_get_escrow.return_value = self.escrow

        signature = {
            "Human-Signature": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
        response = self.client.post(
            Endpoints.WEBHOOK,
            json=self.webhook,
            headers=signature,
        )

        mock_get_escrow.assert_called_once()
        assert_http_error_response(response, Errors.AUTH_SIGNATURE_INVALID)
        assert_no_entries_in_db(ResultsProcessingRequest)
