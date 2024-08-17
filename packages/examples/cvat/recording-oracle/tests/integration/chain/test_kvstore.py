import unittest
from unittest.mock import MagicMock, Mock, patch

import pytest
from human_protocol_sdk.escrow import EscrowClientError
from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError
from web3 import HTTPProvider, Web3
from web3.middleware import construct_sign_and_send_raw_middleware

from src.chain.kvstore import get_reputation_oracle_url, get_role_by_address, register_in_kvstore
from src.core.config import LocalhostConfig

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
            assert reputation_url == DEFAULT_MANIFEST_URL

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
            assert reputation_url == ""

    def test_get_role_by_address(self):
        store_kvstore_value("role", "Reputation Oracle")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_role_by_address(self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS)
            assert reputation_url == "Reputation Oracle"

    def test_get_role_by_address_invalid_escrow(self):
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with pytest.raises(KVStoreClientError) as error:
                get_role_by_address(self.w3.eth.chain_id, "invalid_address")
        assert "Invalid address: invalid_address" == str(error.exception)

    def test_get_role_by_address_invalid_address(self):
        create_escrow(self.w3)
        store_kvstore_value("role", "")
        with patch("src.chain.kvstore.get_web3") as mock_function:
            mock_function.return_value = self.w3
            reputation_url = get_role_by_address(self.w3.eth.chain_id, REPUTATION_ORACLE_ADDRESS)
            assert reputation_url == ""

    def test_store_public_key(self):
        PGP_PUBLIC_KEY_URL_1 = "http://pgp-public-key-url-1"
        PGP_PUBLIC_KEY_URL_2 = "http://pgp-public-key-url-2"

        store = {
            "public_key": None,
            "public_key_hash": None,
        }

        def get_file_url_and_verify_hash(*args, **kwargs):
            public_key = store["public_key"]

            if not public_key:
                return public_key

            hash_ = store["public_key_hash"]

            if hash_ != hash(public_key):
                raise KVStoreClientError("Invalid hash")

            return public_key

        def set_file_url_and_hash(url: str, key: str):
            store.update(
                {
                    key: url,
                    key + "_hash": hash(url),
                }
            )

        with (
            patch(
                "src.core.config.Config.encryption_config.pgp_public_key_url", PGP_PUBLIC_KEY_URL_1
            ),
            patch(
                "human_protocol_sdk.kvstore.KVStoreClient.get_file_url_and_verify_hash",
                get_file_url_and_verify_hash,
            ),
            patch("src.core.config.LocalhostConfig.is_configured") as mock_localhost_configured,
            patch("src.chain.kvstore.get_web3") as mock_web3,
        ):
            mock_localhost_configured.return_value = True
            mock_web3.return_value = self.w3

            kvstore_client = KVStoreClient(self.w3)
            assert kvstore_client.get_file_url_and_verify_hash(LocalhostConfig.addr) is None

            # check that public key will be set to KVStore at first time
            with patch(
                "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash", Mock()
            ) as mock_set_file_url_and_hash:
                mock_set_file_url_and_hash.side_effect = set_file_url_and_hash
                register_in_kvstore()
                mock_set_file_url_and_hash.assert_called_once()
                assert (
                    kvstore_client.get_file_url_and_verify_hash(LocalhostConfig.addr)
                    == PGP_PUBLIC_KEY_URL_1
                )

            # check that the same public key URL is not written to KVStore a second time
            with patch(
                "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash", Mock()
            ) as mock_set_file_url_and_hash:
                mock_set_file_url_and_hash.side_effect = set_file_url_and_hash
                register_in_kvstore()
                mock_set_file_url_and_hash.assert_not_called()

            # check that public key URL and hash will be updated in KVStore if previous hash is outdated/corrupted
            with patch(
                "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash", Mock()
            ) as mock_set_file_url_and_hash:
                mock_set_file_url_and_hash.side_effect = set_file_url_and_hash
                store["public_key_hash"] = "corrupted_hash"
                register_in_kvstore()
                mock_set_file_url_and_hash.assert_called_once()
                assert store["public_key_hash"] != "corrupted_hash"

            # check that a new public key URL will be written to KVStore when an outdated URL is stored there
            with (
                patch(
                    "src.core.config.Config.encryption_config.pgp_public_key_url",
                    PGP_PUBLIC_KEY_URL_2,
                ),
                patch(
                    "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash", Mock()
                ) as mock_set_file_url_and_hash,
            ):
                mock_set_file_url_and_hash.side_effect = set_file_url_and_hash
                register_in_kvstore()
                mock_set_file_url_and_hash.assert_called_once()
                assert (
                    kvstore_client.get_file_url_and_verify_hash(LocalhostConfig.addr)
                    == PGP_PUBLIC_KEY_URL_2
                )
