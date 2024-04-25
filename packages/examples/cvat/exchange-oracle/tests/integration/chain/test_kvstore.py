import unittest
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowClientError, EscrowData

from src.chain.kvstore import get_job_launcher_url, get_recording_oracle_url

from tests.utils.constants import (
    DEFAULT_MANIFEST_URL,
    ESCROW_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    RECORDING_ORACLE_ADDRESS,
    TOKEN_ADDRESS,
)

escrow_address = ESCROW_ADDRESS


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.w3 = Mock()
        self.w3.eth.chain_id = ChainId.LOCALHOST.value
        self.escrow_data = EscrowData(
            chain_id=ChainId.LOCALHOST.name,
            id=1,
            address=escrow_address,
            amount_paid=100,
            balance=100,
            count=0,
            factory_address=FACTORY_ADDRESS,
            launcher=JOB_LAUNCHER_ADDRESS,
            status=Status.Pending.name,
            token=TOKEN_ADDRESS,
            total_funded_amount=1000,
            created_at="",
            manifest_url=DEFAULT_MANIFEST_URL,
            recording_oracle=RECORDING_ORACLE_ADDRESS,
        )

    def test_get_job_launcher_url(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)
            recording_url = get_job_launcher_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, DEFAULT_MANIFEST_URL)

    def test_get_job_launcher_url_invalid_escrow(self):
        with self.assertRaises(EscrowClientError) as error:
            get_job_launcher_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_job_launcher_url_invalid_recording_address(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url="")
            recording_url = get_job_launcher_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")

    def test_get_recording_oracle_url(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            self.escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)
            recording_url = get_recording_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, DEFAULT_MANIFEST_URL)

    def test_get_recording_oracle_url_invalid_escrow(self):
        with self.assertRaises(EscrowClientError) as error:
            get_recording_oracle_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_recording_oracle_url_invalid_recording_address(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            self.escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url="")
            recording_url = get_recording_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")
