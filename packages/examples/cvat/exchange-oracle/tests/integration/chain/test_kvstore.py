import unittest
from unittest.mock import patch

from human_protocol_sdk.escrow import EscrowClientError
from web3 import HTTPProvider, Web3
from web3.middleware import construct_sign_and_send_raw_middleware

from src.chain.kvstore import get_recording_oracle_url

from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV, DEFAULT_URL
from tests.utils.setup_escrow import create_escrow
from tests.utils.setup_kvstore import store_kvstore_value


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

    def test_get_recording_oracle_url(self):
        escrow_address = create_escrow(self.w3)
        store_kvstore_value(DEFAULT_URL)
        with patch("src.chain.kvstore.get_web3") as mock_function:
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
        escrow_address = create_escrow(self.w3)
        store_kvstore_value("")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            recording_url = get_recording_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")
