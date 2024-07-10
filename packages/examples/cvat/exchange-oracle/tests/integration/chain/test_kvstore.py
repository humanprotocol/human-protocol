import unittest
from unittest.mock import MagicMock, Mock, patch

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowClientError, EscrowData
from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError

from src.chain.kvstore import get_job_launcher_url, get_recording_oracle_url, register_in_kvstore
from src.core.config import LocalhostConfig

from tests.utils.constants import (
    DEFAULT_MANIFEST_URL,
    ESCROW_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    PGP_PASSPHRASE,
    PGP_PRIVATE_KEY1,
    PGP_PUBLIC_KEY1,
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

    def test_store_public_key(self):
        store = {
            "public_key": None,
            "public_key_hash": None,
        }

        def get_public_key(*args, **kwargs):
            public_key = store["public_key"]

            if not public_key:
                return public_key

            hash_ = store["public_key_hash"]

            if hash_ != hash(public_key):
                raise KVStoreClientError(f"Invalid hash")

            return public_key

        def set_file_url_and_hash(_, url: str, key: str):
            store.update(
                {
                    # for testing purposes we store key value directly instead of URL
                    key: url,
                    key + "_hash": hash(url),
                }
            )

        with (
            patch("src.core.config.Config.encryption_config.pgp_private_key", PGP_PRIVATE_KEY1),
            patch("src.core.config.Config.encryption_config.pgp_passphrase", PGP_PASSPHRASE),
            # for testing purposes we store key value directly instead of URL
            patch("src.core.config.Config.encryption_config.pgp_public_key_url", PGP_PUBLIC_KEY1),
            patch("human_protocol_sdk.kvstore.KVStoreClient.get_public_key", get_public_key),
            patch(
                "human_protocol_sdk.kvstore.KVStoreClient.set_file_url_and_hash",
                set_file_url_and_hash,
            ),
            patch("src.core.config.LocalhostConfig.is_configured") as mock_localhost_configured,
            patch("src.chain.kvstore.get_web3") as mock_web3,
        ):
            mock_localhost_configured.return_value = True
            mock_web3.return_value = self.w3

            kvstore_client = KVStoreClient(self.w3)
            self.assertIsNone(kvstore_client.get_public_key(LocalhostConfig.addr))

            register_in_kvstore()
            self.assertIsNotNone(kvstore_client.get_public_key(LocalhostConfig.addr))

            # handle a case when a public key has been updated in a bucket, but URL and hash of a key remain in the KVStore
            store["public_key"] = "updated_key"

            with self.assertRaises(KVStoreClientError) as error:
                kvstore_client.get_public_key(LocalhostConfig.addr)
            self.assertEqual("Invalid hash", str(error.exception))
