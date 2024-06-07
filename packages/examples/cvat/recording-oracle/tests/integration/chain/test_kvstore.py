import unittest
from unittest.mock import MagicMock, Mock, patch

import pytest
from human_protocol_sdk.escrow import EscrowClientError
from human_protocol_sdk.kvstore import KVStoreClientError
from web3 import HTTPProvider, Web3
from web3.middleware import construct_sign_and_send_raw_middleware

from src.chain.kvstore import get_reputation_oracle_url, get_role_by_address

from tests.utils.constants import (
    DEFAULT_GAS_PAYER_PRIV,
    DEFAULT_MANIFEST_URL,
    REPUTATION_ORACLE_ADDRESS,
)
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

    def test_get_reputation_oracle_url(self):
        escrow_address = create_escrow(self.w3)
        store_kvstore_value("webhook_url", DEFAULT_MANIFEST_URL)

        with (
            patch("src.chain.kvstore.get_web3") as mock_get_web3,
            patch("src.chain.kvstore.get_escrow") as mock_get_escrow,
            patch("src.chain.kvstore.OperatorUtils.get_leader") as mock_leader,
        ):
            mock_get_web3.return_value = self.w3
            mock_escrow = Mock()
            mock_escrow.reputationOracle = REPUTATION_ORACLE_ADDRESS
            mock_get_escrow.return_value = mock_escrow
            mock_leader.return_value = MagicMock(webhook_url=DEFAULT_MANIFEST_URL)

            reputation_url = get_reputation_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(reputation_url, DEFAULT_MANIFEST_URL)

    def test_get_reputation_oracle_url_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with pytest.raises(EscrowClientError, match="Invalid escrow address: "):
                get_reputation_oracle_url(self.w3.eth.chain_id, "invalid_address")

    def test_get_reputation_oracle_url_invalid_address(self):
        create_escrow(self.w3)
        store_kvstore_value("webhook_url", "")
        with (
            patch("src.chain.kvstore.get_web3") as mock_get_web3,
            patch("src.chain.kvstore.get_escrow") as mock_get_escrow,
            patch("src.chain.kvstore.OperatorUtils.get_leader") as mock_leader,
        ):
            mock_get_web3.return_value = self.w3
            mock_escrow = Mock()
            mock_escrow.reputation_oracle = REPUTATION_ORACLE_ADDRESS
            mock_get_escrow.return_value = mock_escrow
            mock_leader.return_value = MagicMock(webhook_url="")

            reputation_url = get_reputation_oracle_url(
                self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS
            )
            self.assertEqual(reputation_url, "")

    def test_get_role_by_address(self):
        store_kvstore_value("role", "Reputation Oracle")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_role_by_address(self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS)
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
            reputation_url = get_role_by_address(self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS)
            self.assertEqual(reputation_url, "")
