import json
import unittest
from unittest.mock import patch

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowClientError, EscrowData
from human_protocol_sdk.storage import StorageClientError

from src.chain.escrow import (
    get_escrow_manifest,
    get_job_launcher_address,
    get_recording_oracle_address,
    validate_escrow,
)

from tests.utils.constants import (
    ESCROW_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    RECORDING_ORACLE_ADDRESS,
    TOKEN_ADDRESS,
)

escrow_address = ESCROW_ADDRESS
chain_id = ChainId.LOCALHOST.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
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

    def test_validate_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = self.escrow_data
            validation = validate_escrow(chain_id, escrow_address)
            self.assertIsNone(validation)

    def test_validate_escrow_invalid_address(self):
        with self.assertRaises(EscrowClientError) as error:
            validate_escrow(chain_id, "invalid_address")

        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_validate_escrow_invalid_status(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.status = Status.Launched.name
            mock_function.return_value = self.escrow_data
            with self.assertRaises(ValueError) as error:
                validate_escrow(chain_id, escrow_address)
        self.assertEqual(
            f"Escrow is not in any of the accepted states (Pending). Current state: {self.escrow_data.status}",
            str(error.exception),
        )

    def test_validate_escrow_without_funds(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.balance = "0"
            mock_function.return_value = self.escrow_data
            with self.assertRaises(ValueError) as error:
                validate_escrow(chain_id, escrow_address)
        self.assertEqual(
            f"Escrow doesn't have funds",
            str(error.exception),
        )

    def test_get_escrow_manifest(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function, patch(
            "src.chain.escrow.StorageClient.download_file_from_url"
        ) as mock_storage:
            mock_storage.return_value = json.dumps({"title": "test"}).encode()
            mock_function.return_value = self.escrow_data
            manifest = get_escrow_manifest(chain_id, escrow_address)
            self.assertIsInstance(manifest, dict)
            self.assertIsNotNone(manifest)

    def test_get_escrow_manifest_invalid_address(self):
        with self.assertRaises(EscrowClientError) as error:
            get_escrow_manifest(chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_escrow_manifest_invalid_url(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.manifestUrl = "invalid_url"
            mock_function.return_value = self.escrow_data
            with self.assertRaises(StorageClientError) as error:
                get_escrow_manifest(chain_id, escrow_address)
        self.assertEqual(f"Invalid URL: invalid_url", str(error.exception))

    def test_get_job_launcher_address(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = self.escrow_data
            job_launcher_address = get_job_launcher_address(chain_id, escrow_address)
            self.assertIsInstance(job_launcher_address, str)
            self.assertEqual(job_launcher_address, JOB_LAUNCHER_ADDRESS)

    def test_get_job_launcher_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as error:
            get_job_launcher_address(chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_job_launcher_address_invalid_chain_id(self):
        with self.assertRaises(EscrowClientError) as error:
            get_job_launcher_address(123, escrow_address)
        self.assertEqual(f"Invalid ChainId", str(error.exception))

    def test_get_job_launcher_address_empty_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = None
            with self.assertRaises(Exception) as error:
                get_job_launcher_address(chain_id, escrow_address)
            self.assertEqual(f"Can't find escrow {ESCROW_ADDRESS}", str(error.exception))

    def test_get_recording_oracle_address(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.recordingOracle = RECORDING_ORACLE_ADDRESS
            mock_function.return_value = self.escrow_data
            recording_oracle_address = get_recording_oracle_address(chain_id, escrow_address)
            self.assertIsInstance(recording_oracle_address, str)
            self.assertEqual(recording_oracle_address, RECORDING_ORACLE_ADDRESS)

    def test_get_recording_oracle_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as error:
            get_recording_oracle_address(chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_recording_oracle_address_invalid_chain_id(self):
        with self.assertRaises(EscrowClientError) as error:
            get_recording_oracle_address(123, escrow_address)
        self.assertEqual(f"Invalid ChainId", str(error.exception))

    def test_get_recording_oracle_address_empty_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = None
            with self.assertRaises(Exception) as error:
                get_recording_oracle_address(chain_id, escrow_address)
            self.assertEqual(f"Can't find escrow {ESCROW_ADDRESS}", str(error.exception))
