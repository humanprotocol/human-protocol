import unittest
from unittest.mock import patch

from src.chain.kvstore import get_reputation_oracle_url, get_role_by_address
from tests.utils.setup_kvstore import store_kvstore_value
from tests.utils.setup_escrow import create_escrow
from tests.utils.constants import (
    DEFAULT_GAS_PAYER_PRIV,
    DEFAULT_URL,
    REPUTATION_ORACLE_ADDRESS,
)

from human_protocol_sdk.kvstore import KVStoreClientError

from web3 import Web3, HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware


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

    def test_get_reputation_oracle_url(self):
        store_kvstore_value("webhook_url", DEFAULT_URL)
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_reputation_oracle_url(
                self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS
            )
            self.assertEqual(reputation_url, DEFAULT_URL)

    def test_get_reputation_oracle_url_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(KVStoreClientError) as error:
                get_reputation_oracle_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid address: invalid_address", str(error.exception))

    def test_get_reputation_oracle_url_invalid_address(self):
        create_escrow(self.w3)
        store_kvstore_value("webhook_url", "")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_reputation_oracle_url(
                self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS
            )
            self.assertEqual(reputation_url, "")

    def test_get_role_by_address(self):
        store_kvstore_value("role", "Reputation Oracle")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_role_by_address(
                self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS
            )
            self.assertEqual(reputation_url, "Reputation Oracle")

    def test_get_role_by_address_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with self.assertRaises(KVStoreClientError) as error:
                get_role_by_address(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid address: invalid_address", str(error.exception))

    def test_get_role_by_address_invalid_address(self):
        create_escrow(self.w3)
        store_kvstore_value("role", "")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_role_by_address(
                self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS
            )
            self.assertEqual(reputation_url, "")
