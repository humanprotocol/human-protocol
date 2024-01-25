import unittest
from unittest.mock import Mock, patch

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowClientError, EscrowData

from src.chain.kvstore import get_job_launcher_url, get_recording_oracle_url

from tests.utils.constants import (
    DEFAULT_URL,
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
            escrow_address,
            escrow_address,
            "0",
            "1000",
            0,
            FACTORY_ADDRESS,
            JOB_LAUNCHER_ADDRESS,
            Status.Pending.name,
            TOKEN_ADDRESS,
            "1000",
            "",
            ChainId.LOCALHOST.name,
        )

    def test_get_job_launcher_url(self):
        with patch("src.chain.kvstore.get_web3") as mock_function, patch(
            "src.chain.kvstore.get_escrow"
        ) as mock_escrow, patch("src.chain.kvstore.StakingClient.get_leader") as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = {"webhook_url": DEFAULT_URL}
            mock_function.return_value = self.w3
            recording_url = get_job_launcher_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, DEFAULT_URL)

    def test_get_job_launcher_url_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(EscrowClientError) as error:
                get_job_launcher_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_job_launcher_url_invalid_recording_address(self):
        with patch("src.chain.kvstore.get_web3") as mock_function, patch(
            "src.chain.kvstore.get_escrow"
        ) as mock_escrow, patch("src.chain.kvstore.StakingClient.get_leader") as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = {"webhook_url": ""}
            mock_function.return_value = self.w3
            recording_url = get_job_launcher_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")

    def test_get_recording_oracle_url(self):
        with patch("src.chain.kvstore.get_web3") as mock_function, patch(
            "src.chain.kvstore.get_escrow"
        ) as mock_escrow, patch("src.chain.kvstore.StakingClient.get_leader") as mock_leader:
            self.escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = {"webhook_url": DEFAULT_URL}
            mock_function.return_value = self.w3
            recording_url = get_recording_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, DEFAULT_URL)

    def test_get_recording_oracle_url_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(EscrowClientError) as error:
                get_recording_oracle_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_recording_oracle_url_invalid_recording_address(self):
        with patch("src.chain.kvstore.get_web3") as mock_function, patch(
            "src.chain.kvstore.get_escrow"
        ) as mock_escrow, patch("src.chain.kvstore.StakingClient.get_leader") as mock_leader:
            self.escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = {"webhook_url": ""}
            mock_function.return_value = self.w3
            recording_url = get_recording_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")
