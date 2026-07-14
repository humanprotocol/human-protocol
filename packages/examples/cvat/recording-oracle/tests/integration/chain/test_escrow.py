import json
import unittest
from unittest.mock import MagicMock, patch

import pytest
from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.encryption import EncryptionUtils
from human_protocol_sdk.escrow import EscrowClientError, EscrowData

from src.chain.escrow import (
    get_escrow_manifest,
    store_results,
    validate_escrow,
)

from tests.utils.constants import (
    DEFAULT_HASH,
    DEFAULT_MANIFEST_URL,
    ESCROW_ADDRESS,
    EXCHANGE_ORACLE_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    PGP_PASSPHRASE,
    PGP_PRIVATE_KEY1,
    PGP_PUBLIC_KEY1,
    PGP_PUBLIC_KEY2,
    RECORDING_ORACLE_ADDRESS,
    REPUTATION_ORACLE_ADDRESS,
    TOKEN_ADDRESS,
)

escrow_address = ESCROW_ADDRESS
chain_id = ChainId.LOCALHOST.value


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.escrow_data = EscrowData(
            chain_id=ChainId.LOCALHOST.name,
            id=1,
            address=escrow_address,
            amount_paid=100,
            balance=100,
            count=0,
            factory_address=FACTORY_ADDRESS,
            launcher=JOB_LAUNCHER_ADDRESS,
            job_requester_id=JOB_LAUNCHER_ADDRESS,
            status=Status.Pending.name,
            token=TOKEN_ADDRESS,
            total_funded_amount=1000,
            created_at="0",
            manifest=DEFAULT_MANIFEST_URL,
            recording_oracle=RECORDING_ORACLE_ADDRESS,
            exchange_oracle=EXCHANGE_ORACLE_ADDRESS,
            reputation_oracle=REPUTATION_ORACLE_ADDRESS,
        )

    def test_validate_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = self.escrow_data
            assert validate_escrow(chain_id, escrow_address) is None

    def test_validate_escrow_invalid_address(self):
        with pytest.raises(EscrowClientError, match="Invalid escrow address: invalid_address"):
            validate_escrow(chain_id, "invalid_address")

    def test_validate_escrow_invalid_status(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.status = Status.Partial.name
            mock_function.return_value = self.escrow_data
            with pytest.raises(
                ValueError,
                match=r"Escrow is not in any of the accepted states \(Pending\)",
            ):
                validate_escrow(chain_id, escrow_address)

    def test_validate_escrow_without_funds(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.balance = 0
            mock_function.return_value = self.escrow_data
            with pytest.raises(ValueError, match="Escrow doesn't have funds"):
                validate_escrow(chain_id, escrow_address)

            assert validate_escrow(chain_id, escrow_address, allow_no_funds=True) is None

    def test_get_escrow_manifest(self):
        with (
            patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function,
            patch("src.chain.escrow._get_manifest_content") as mock_download,
        ):
            mock_download.return_value = json.dumps({"title": "test"})
            mock_function.return_value = self.escrow_data
            manifest = get_escrow_manifest(chain_id, escrow_address)
            assert isinstance(manifest, dict)
            assert manifest is not None

    def test_get_escrow_manifest_invalid_address(self):
        with pytest.raises(EscrowClientError, match="Invalid escrow address: invalid_address"):
            get_escrow_manifest(chain_id, "invalid_address")

    def test_get_encrypted_escrow_manifest(self):
        with (
            patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function,
            patch("src.chain.escrow._get_manifest_content") as mock_download,
            patch("src.core.config.Config.encryption_config.pgp_private_key", PGP_PRIVATE_KEY1),
            patch("src.core.config.Config.encryption_config.pgp_passphrase", PGP_PASSPHRASE),
            patch(
                "src.core.config.Config.encryption_config.pgp_public_key_url", "http:///some-url"
            ),
        ):
            mock_function.return_value = self.escrow_data
            original_manifest_content = {"title": "test"}
            original_manifest = json.dumps(original_manifest_content)

            encrypted_manifest = EncryptionUtils.encrypt(
                original_manifest, public_keys=[PGP_PUBLIC_KEY1, PGP_PUBLIC_KEY2]
            )
            assert encrypted_manifest != original_manifest

            mock_download.return_value = encrypted_manifest
            downloaded_manifest_content = get_escrow_manifest(chain_id, escrow_address)
            assert downloaded_manifest_content == original_manifest_content

    def test_store_results(self):
        with (
            patch("src.chain.escrow.get_web3"),
            patch("src.chain.escrow.EscrowClient") as mock_client_cls,
        ):
            assert (
                store_results(chain_id, escrow_address, DEFAULT_MANIFEST_URL, DEFAULT_HASH) is None
            )
            mock_client_cls.return_value.store_results.assert_called_once_with(
                escrow_address, DEFAULT_MANIFEST_URL, DEFAULT_HASH
            )

    def test_store_results_invalid_url(self):
        w3 = MagicMock()
        w3.eth.chain_id = chain_id
        with (
            patch("src.chain.escrow.get_web3", return_value=w3),
            pytest.raises(EscrowClientError, match="Invalid URL: invalid_url"),
        ):
            store_results(chain_id, escrow_address, "invalid_url", DEFAULT_HASH)

    def test_store_results_invalid_hash(self):
        w3 = MagicMock()
        w3.eth.chain_id = chain_id
        with (
            patch("src.chain.escrow.get_web3", return_value=w3),
            pytest.raises(EscrowClientError, match="Invalid empty hash"),
        ):
            store_results(chain_id, escrow_address, DEFAULT_MANIFEST_URL, "")
