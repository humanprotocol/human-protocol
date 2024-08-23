import unittest
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.escrow import EscrowClientError, EscrowData
from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError, KVStoreUtils
from human_protocol_sdk.constants import ChainId, Status
from web3.middleware import construct_sign_and_send_raw_middleware

from src.chain.kvstore import get_reputation_oracle_url, register_in_kvstore
from src.core.config import LocalhostConfig

from tests.utils.constants import (
    DEFAULT_MANIFEST_URL,
    REPUTATION_ORACLE_ADDRESS,
    ESCROW_ADDRESS,
    TOKEN_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    REPUTATION_ORACLE_WEBHOOK_URL,
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
            reputation_oracle=REPUTATION_ORACLE_ADDRESS,
        )

    def test_get_reputation_oracle_url(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url=REPUTATION_ORACLE_WEBHOOK_URL)
            reputation_url = get_reputation_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(reputation_url, REPUTATION_ORACLE_WEBHOOK_URL)

    def test_get_reputation_oracle_url_invalid_escrow(self):
        with self.assertRaises(EscrowClientError) as error:
            get_reputation_oracle_url(self.w3.eth.chain_id, "invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(error.exception))

    def test_get_reputation_oracle_url_invalid_address(self):
        with patch("src.chain.kvstore.get_escrow") as mock_escrow, patch(
            "src.chain.kvstore.OperatorUtils.get_leader"
        ) as mock_leader:
            mock_escrow.return_value = self.escrow_data
            mock_leader.return_value = MagicMock(webhook_url="")
            recording_url = get_reputation_oracle_url(self.w3.eth.chain_id, escrow_address)
            self.assertEqual(recording_url, "")

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
                raise KVStoreClientError(f"Invalid hash")

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
                "human_protocol_sdk.kvstore.KVStoreUtils.get_file_url_and_verify_hash",
                get_file_url_and_verify_hash,
            ),
            patch("src.core.config.LocalhostConfig.is_configured") as mock_localhost_configured,
            patch("src.chain.kvstore.get_web3") as mock_web3,
        ):
            mock_localhost_configured.return_value = True
            mock_web3.return_value = self.w3

            self.assertIsNone(KVStoreUtils.get_file_url_and_verify_hash(ChainId.LOCALHOST, LocalhostConfig.addr))

            # check that public key will be set to KVStore at first time
            with patch(
                "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash", Mock()
            ) as mock_set_file_url_and_hash:
                mock_set_file_url_and_hash.side_effect = set_file_url_and_hash
                register_in_kvstore()
                mock_set_file_url_and_hash.assert_called_once()
                self.assertEquals(
                    KVStoreUtils.get_file_url_and_verify_hash(ChainId.LOCALHOST, LocalhostConfig.addr),
                    PGP_PUBLIC_KEY_URL_1,
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
                self.assertNotEquals(store["public_key_hash"], "corrupted_hash")

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
                self.assertEquals(
                    KVStoreUtils.get_file_url_and_verify_hash(ChainId(self.w3.eth.chain_id), LocalhostConfig.addr),
                    PGP_PUBLIC_KEY_URL_2,
                )
