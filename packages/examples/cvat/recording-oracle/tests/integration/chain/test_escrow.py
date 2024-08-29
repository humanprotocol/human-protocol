import json
import unittest
from unittest.mock import MagicMock, patch

import pytest
from human_protocol_sdk.encryption import EncryptionUtils
from human_protocol_sdk.escrow import EscrowClientError
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from src.chain.escrow import (
    get_escrow_manifest,
    get_reputation_oracle_address,
    store_results,
    validate_escrow,
)
from src.core.config import Config

from tests.utils.constants import (
    DEFAULT_GAS_PAYER_PRIV,
    DEFAULT_HASH,
    DEFAULT_MANIFEST_URL,
    PGP_PASSPHRASE,
    PGP_PRIVATE_KEY1,
    PGP_PUBLIC_KEY1,
    PGP_PUBLIC_KEY2,
    REPUTATION_ORACLE_ADDRESS,
)
from tests.utils.setup_escrow import (
    amount,
    bulk_payout,
    create_escrow,
    fund_escrow,
    setup_escrow,
    get_intermediate_results_url,
)


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
        self.network_config = Config.localhost

        self.escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, self.escrow_address)
        setup_escrow(self.w3, self.escrow_address)

    def escrow(self, status: str = "Pending", balance: float = amount):
        mock_escrow = MagicMock()
        mock_escrow.status = status
        mock_escrow.balance = balance
        mock_escrow.reputation_oracle = REPUTATION_ORACLE_ADDRESS
        mock_escrow.manifest_url = "http://s3.amazonaws.com"
        return mock_escrow

    def test_validate_escrow(self):
        with patch("src.chain.escrow.get_escrow") as mock_get_escrow:
            mock_get_escrow.return_value = self.escrow("Pending", amount)
            # should not throw an exception
            validate_escrow(self.network_config.chain_id, self.escrow_address)

    def test_validate_escrow_without_funds(self):
        with patch("src.chain.escrow.get_escrow") as mock_get_escrow:
            mock_get_escrow.return_value = self.escrow("Pending", 0)

            with pytest.raises(ValueError, match="Escrow doesn't have funds"):
                validate_escrow(-1, "", allow_no_funds=False)

            # should not throw an exception
            validate_escrow(self.network_config.chain_id, self.escrow_address, allow_no_funds=True)

    def test_validate_escrow_invalid_status(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        setup_escrow(self.w3, self.escrow_address)
        bulk_payout(
            self.w3,
            escrow_address,
            self.gas_payer.address,
            Web3.to_wei(50, "milliether"),
        )
        with patch("src.chain.escrow.get_escrow") as mock_get_escrow:
            mock_get_escrow.return_value = self.escrow("Partial", 0.95)

            with pytest.raises(ValueError, match="Escrow is not in any of the accepted states"):
                validate_escrow(self.w3.eth.chain_id, escrow_address)

    def test_get_escrow_manifest(self):
        with (
            patch("src.chain.escrow.get_escrow") as mock_get_escrow,
            patch("src.chain.escrow.StorageUtils.download_file_from_url") as mock_download,
        ):
            mock_download.return_value = json.dumps({"title": "test"}).encode()

            mock_get_escrow.return_value = self.escrow()
            manifest = get_escrow_manifest(self.network_config.chain_id, self.escrow_address)
            assert isinstance(manifest, dict)
            assert manifest is not None

    def test_get_encrypted_escrow_manifest(self):
        with (
            patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function,
            patch("src.chain.escrow.StorageUtils.download_file_from_url") as mock_download,
            patch("src.core.config.Config.encryption_config.pgp_private_key", PGP_PRIVATE_KEY1),
            patch("src.core.config.Config.encryption_config.pgp_passphrase", PGP_PASSPHRASE),
            patch(
                "src.core.config.Config.encryption_config.pgp_public_key_url", "http:///some-url"
            ),
        ):
            mock_function.return_value = self.escrow()
            original_manifest_content = {
                "title": "test",
            }
            original_manifest = json.dumps(original_manifest_content)

            encrypted_manifest = EncryptionUtils.encrypt(
                original_manifest, public_keys=[PGP_PUBLIC_KEY1, PGP_PUBLIC_KEY2]
            )
            assert encrypted_manifest != original_manifest

            mock_download.return_value = encrypted_manifest.encode()
            downloaded_manifest_content = get_escrow_manifest(
                self.network_config.chain_id, self.escrow_address
            )
            assert downloaded_manifest_content == original_manifest_content

    def test_store_results(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        setup_escrow(self.w3, self.escrow_address)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            results = store_results(
                self.w3.eth.chain_id, escrow_address, DEFAULT_MANIFEST_URL, DEFAULT_HASH
            )
            assert results is None
            intermediate_results_url = get_intermediate_results_url(self.w3, escrow_address)
            assert intermediate_results_url == DEFAULT_MANIFEST_URL

    def test_store_results_invalid_url(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        setup_escrow(self.w3, self.escrow_address)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with pytest.raises(EscrowClientError, match="Invalid URL: invalid_url"):
                store_results(self.w3.eth.chain_id, escrow_address, "invalid_url", DEFAULT_HASH)

    def test_store_results_invalid_hash(self):
        escrow_address = create_escrow(self.w3)
        fund_escrow(self.w3, escrow_address)
        setup_escrow(self.w3, self.escrow_address)
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with pytest.raises(EscrowClientError, match="Invalid empty hash"):
                store_results(self.w3.eth.chain_id, escrow_address, DEFAULT_MANIFEST_URL, "")

    def test_get_reputation_oracle_address(self):
        escrow_address = create_escrow(self.w3)
        with (
            patch("src.chain.escrow.get_web3") as mock_get_web3,
            patch("src.chain.escrow.get_escrow") as mock_get_escrow,
        ):
            mock_get_web3.return_value = self.w3
            mock_escrow = MagicMock()
            mock_escrow.reputation_oracle = REPUTATION_ORACLE_ADDRESS
            mock_get_escrow.return_value = mock_escrow
            address = get_reputation_oracle_address(self.w3.eth.chain_id, escrow_address)
            assert isinstance(address, str)
            assert address is not None

    def test_get_reputation_oracle_address_invalid_address(self):
        with patch("src.chain.escrow.get_web3") as mock_function:
            mock_function.return_value = self.w3
            with pytest.raises(EscrowClientError, match="Invalid escrow address:"):
                get_reputation_oracle_address(self.w3.eth.chain_id, "invalid_address")

    def test_get_reputation_oracle_address_invalid_chain_id(self):
        with pytest.raises(Exception, match="Can't find escrow"):
            get_reputation_oracle_address(1, "0x1234567890123456789012345678901234567890")
