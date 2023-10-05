import unittest
from unittest.mock import patch

from human_protocol_sdk.escrow import EscrowClientError
from human_protocol_sdk.storage import StorageClientError
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.chain.escrow import get_escrow_manifest, get_job_launcher_address, validate_escrow

from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV
from tests.utils.setup_escrow import bulk_payout, create_escrow, fund_escrow


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.w3 = Web3(HTTPProvider())

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        self.w3.eth.default_account = self.gas_payer.address

    def test_validate_escrow(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            validation = validate_escrow(self.w3.eth.chain_id, escrow_address)
            self.assertIsNone(validation)

    def test_validate_escrow_invalid_address(self):
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(EscrowClientError) as error:
                validate_escrow(self.w3.eth.chain_id, "invalid_address")

        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_validate_escrow_without_funds(self):
        escrow_address = create_escrow(self.w3)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(ValueError) as error:
                validate_escrow(self.w3.eth.chain_id, escrow_address)

        self.assertEqual(f"Escrow doesn't have funds", str(error.exception))

    def test_validate_escrow_invalid_status(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        bulk_payout(
            self.w3,
            escrow_address,
            self.gas_payer.address,
            Web3.toWei(50, "milliether"),
        )
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3

            with self.assertRaises(ValueError) as error:
                validate_escrow(self.w3.eth.chain_id, escrow_address)
        self.assertEqual(
            f"Escrow is not in a Pending state. Current state: Partial",
            str(error.exception),
        )

    def test_get_escrow_manifest(self):
        escrow_address = create_escrow(self.w3)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            manifest = get_escrow_manifest(self.w3.eth.chain_id, escrow_address)
            self.assertIsInstance(manifest, dict)
            self.assertIsNotNone(manifest)

    def test_get_escrow_manifest_invalid_address(self):
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(EscrowClientError) as error:
                get_escrow_manifest(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_escrow_manifest_invalid_url(self):
        escrow_address = create_escrow(self.w3)
        with patch("src.chain.escrow.get_web3") as mock_function:
            with patch("src.chain.escrow.EscrowClient") as mock_client:
                mock_escrow_client = mock_client.return_value
                mock_escrow_client.get_manifest_url.return_value = "invalid_url"
                mock_function.return_value = self.w3
                with self.assertRaises(StorageClientError) as error:
                    get_escrow_manifest(self.w3.eth.chain_id, escrow_address)
        self.assertEqual(f"Invalid URL: invalid_url", str(error.exception))

    def test_get_job_launcher_address(self):
        escrow_address = create_escrow(self.w3)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            job_launcher_address = get_job_launcher_address(self.w3.eth.chain_id, escrow_address)
            self.assertIsInstance(job_launcher_address, str)
            self.assertIsNotNone(job_launcher_address)

    def test_get_job_launcher_address_invalid_address(self):
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(EscrowClientError) as error:
                get_job_launcher_address(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_job_launcher_address_invalid_chain_id(self):
        with self.assertRaises(ValueError) as error:
            get_job_launcher_address(1, "0x1234567890123456789012345678901234567890")
        self.assertEqual(f"1 is not in available list of networks.", str(error.exception))
