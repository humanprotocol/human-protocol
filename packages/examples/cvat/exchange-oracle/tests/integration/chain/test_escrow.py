import json
import unittest
from unittest.mock import patch

import pytest
from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.encryption import EncryptionUtils
from human_protocol_sdk.escrow import EscrowClientError, EscrowData

from src.chain.escrow import (
    get_escrow_manifest,
    get_job_launcher_address,
    get_recording_oracle_address,
    validate_escrow,
)

from tests.utils.constants import (
    DEFAULT_MANIFEST_URL,
    ESCROW_ADDRESS,
    FACTORY_ADDRESS,
    JOB_LAUNCHER_ADDRESS,
    PGP_PASSPHRASE,
    PGP_PRIVATE_KEY1,
    PGP_PUBLIC_KEY1,
    PGP_PUBLIC_KEY2,
    RECORDING_ORACLE_ADDRESS,
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
            status=Status.Pending.name,
            token=TOKEN_ADDRESS,
            total_funded_amount=1000,
            created_at="",
            manifest_url=DEFAULT_MANIFEST_URL,
            recording_oracle=RECORDING_ORACLE_ADDRESS,
        )

    def test_validate_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = self.escrow_data
            validation = validate_escrow(chain_id, escrow_address)
            assert validation is None

    def test_validate_escrow_invalid_address(self):
        with pytest.raises(EscrowClientError) as error:
            validate_escrow(chain_id, "invalid_address")

        assert str(error.exception) == "Invalid escrow address: invalid_address"

    def test_validate_escrow_invalid_status(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.status = Status.Launched.name
            mock_function.return_value = self.escrow_data
            with pytest.raises(ValueError) as error:
                validate_escrow(chain_id, escrow_address)
        assert (
            f"Escrow is not in any of the accepted states (Pending). Current state: {self.escrow_data.status}"
            == str(error.exception)
        )

    def test_validate_escrow_without_funds(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.balance = "0"
            mock_function.return_value = self.escrow_data
            with pytest.raises(ValueError) as error:
                validate_escrow(chain_id, escrow_address)
        assert str(error.exception) == "Escrow doesn't have funds"

    def test_get_escrow_manifest(self):
        with (
            patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function,
            patch("src.chain.escrow.StorageUtils.download_file_from_url") as mock_download,
        ):
            mock_download.return_value = json.dumps({"title": "test"}).encode()
            mock_function.return_value = self.escrow_data
            manifest = get_escrow_manifest(chain_id, escrow_address)
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
            mock_function.return_value = self.escrow_data
            original_manifest_content = {
                "title": "test",
            }
            original_manifest = json.dumps(original_manifest_content)

            encrypted_manifest = EncryptionUtils.encrypt(
                original_manifest, public_keys=[PGP_PUBLIC_KEY1, PGP_PUBLIC_KEY2]
            )
            assert encrypted_manifest != original_manifest

            mock_download.return_value = encrypted_manifest.encode()
            downloaded_manifest_content = get_escrow_manifest(chain_id, escrow_address)
            assert downloaded_manifest_content == original_manifest_content

    def test_get_escrow_manifest_invalid_address(self):
        with pytest.raises(EscrowClientError) as error:
            get_escrow_manifest(chain_id, "invalid_address")
        assert str(error.exception) == "Invalid escrow address: invalid_address"

    def test_get_job_launcher_address(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = self.escrow_data
            job_launcher_address = get_job_launcher_address(chain_id, escrow_address)
            assert isinstance(job_launcher_address, str)
            assert job_launcher_address == JOB_LAUNCHER_ADDRESS

    def test_get_job_launcher_address_invalid_address(self):
        with pytest.raises(EscrowClientError) as error:
            get_job_launcher_address(chain_id, "invalid_address")
        assert str(error.exception) == "Invalid escrow address: invalid_address"

    def test_get_job_launcher_address_invalid_chain_id(self):
        with pytest.raises(ValueError) as error:
            get_job_launcher_address(123, escrow_address)
        assert str(error.exception) == "123 is not a valid ChainId"

    def test_get_job_launcher_address_empty_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = None
            with pytest.raises(Exception) as error:
                get_job_launcher_address(chain_id, escrow_address)
            assert f"Can't find escrow {ESCROW_ADDRESS}" == str(error.exception)

    def test_get_recording_oracle_address(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            self.escrow_data.recording_oracle = RECORDING_ORACLE_ADDRESS
            mock_function.return_value = self.escrow_data
            recording_oracle_address = get_recording_oracle_address(chain_id, escrow_address)
            assert isinstance(recording_oracle_address, str)
            assert recording_oracle_address == RECORDING_ORACLE_ADDRESS

    def test_get_recording_oracle_address_invalid_address(self):
        with pytest.raises(EscrowClientError) as error:
            get_recording_oracle_address(chain_id, "invalid_address")
        assert str(error.exception) == "Invalid escrow address: invalid_address"

    def test_get_recording_oracle_address_invalid_chain_id(self):
        with pytest.raises(ValueError) as error:
            get_recording_oracle_address(123, escrow_address)
        assert str(error.exception) == "123 is not a valid ChainId"

    def test_get_recording_oracle_address_empty_escrow(self):
        with patch("src.chain.escrow.EscrowUtils.get_escrow") as mock_function:
            mock_function.return_value = None
            with pytest.raises(Exception) as error:
                get_recording_oracle_address(chain_id, escrow_address)
            assert f"Can't find escrow {ESCROW_ADDRESS}" == str(error.exception)
