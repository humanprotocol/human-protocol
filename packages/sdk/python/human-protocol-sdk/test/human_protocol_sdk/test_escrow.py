from types import SimpleNamespace
import unittest
from datetime import datetime
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from unittest.mock import MagicMock, PropertyMock, patch

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.escrow import (
    EscrowClient,
    EscrowClientError,
    EscrowConfig,
    EscrowFilter,
)
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider


class EscrowTestCase(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock(spec=HTTPProvider)
        self.w3 = Web3(self.mock_provider)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer)
        )
        self.w3.eth.default_account = self.gas_payer.address

        self.mock_chain_id = ChainId.LOCALHOST.value
        type(self.w3.eth).chain_id = PropertyMock(return_value=self.mock_chain_id)

        self.escrow = EscrowClient(self.w3)

    def test_init_with_valid_inputs(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrow = EscrowClient(w3)

        self.assertEqual(escrow.w3, w3)
        self.assertEqual(escrow.network, NETWORKS[ChainId(mock_chain_id)])
        self.assertIsNotNone(escrow.factory_contract)

    def test_init_with_invalid_chain_id(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = 9999
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(EscrowClientError) as cm:
            EscrowClient(w3)
        self.assertEqual(f"Invalid ChainId: {mock_chain_id}", str(cm.exception))

    def test_escrow_config_valid_params(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        manifest_url = "http://localhost"
        hash = "test"

        escrow_config = EscrowConfig(
            recording_oracle_address,
            reputation_oracle_address,
            recording_oracle_fee,
            reputation_oracle_fee,
            manifest_url,
            hash,
        )

        self.assertEqual(
            escrow_config.recording_oracle_address, recording_oracle_address
        )
        self.assertEqual(
            escrow_config.reputation_oracle_address, reputation_oracle_address
        )
        self.assertEqual(escrow_config.recording_oracle_fee, recording_oracle_fee)
        self.assertEqual(escrow_config.reputation_oracle_fee, reputation_oracle_fee)
        self.assertEqual(escrow_config.manifest_url, manifest_url)
        self.assertEqual(escrow_config.hash, hash)

    def test_escrow_config_invalid_address(self):
        invalid_address = "invalid_address"
        valid_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        manifest_url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                invalid_address,
                valid_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(
            f"Invalid recording oracle address: {invalid_address}", str(cm.exception)
        )

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                valid_address,
                invalid_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(
            f"Invalid reputation oracle address: {invalid_address}", str(cm.exception)
        )

    def test_escrow_config_invalid_fee(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        valid_oracle_fee = 10
        manifest_url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                (-2),
                valid_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                1000,
                valid_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                valid_oracle_fee,
                (-2),
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                valid_oracle_fee,
                1000,
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                55,
                55,
                manifest_url,
                hash,
            )
        self.assertEqual("Total fee must be less than 100", str(cm.exception))

    def test_escrow_config_invalid_url(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        manifest_url = "test"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(f"Invalid manifest URL: {manifest_url}", str(cm.exception))

    def test_escrow_config_invalid_hash(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        manifest_url = "http://localhost"
        hash = ""

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Invalid empty manifest hash", str(cm.exception))

    def test_create_escrow(self):
        mock_function_create = MagicMock()
        self.escrow.factory_contract.functions.createEscrow = mock_function_create
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = [self.w3.eth.default_account]

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            with patch("human_protocol_sdk.escrow.next") as mock_function_next:
                mock_function_next.return_value = SimpleNamespace(
                    args=SimpleNamespace(escrow=escrow_address)
                )
                response = self.escrow.create_escrow(token_address, trusted_handlers)

                self.assertEqual(response, escrow_address)
                mock_function_create.assert_called_once_with(
                    token_address, trusted_handlers
                )
                mock_function_next.assert_called_once()

                mock_function.assert_called_once_with(
                    self.w3,
                    "Create Escrow",
                    mock_function_create.return_value,
                    EscrowClientError,
                )

    def test_create_escrow_invalid_token(self):
        token_address = "invalid_address"
        trusted_handlers = [self.w3.eth.default_account]

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_escrow(token_address, trusted_handlers)
        self.assertEqual(f"Invalid token address: {token_address}", str(cm.exception))

    def test_create_escrow_invalid_handler(self):
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = ["invalid_address"]

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_escrow(token_address, trusted_handlers)
        self.assertEqual(
            f"Invalid handler address: {trusted_handlers[0]}", str(cm.exception)
        )

    def test_create_escrow_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = ["0x1234567890123456789012345678901234567890"]
        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.create_escrow(token_address, trusted_handlers)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_setup(self):
        mock_contract = MagicMock()
        mock_contract.functions.setup = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.setup(escrow_address, escrow_config)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.setup.assert_called_once_with(
                escrow_config.recording_oracle_address,
                escrow_config.reputation_oracle_address,
                escrow_config.recording_oracle_fee,
                escrow_config.reputation_oracle_fee,
                escrow_config.manifest_url,
                escrow_config.hash,
            )
            mock_function.assert_called_once_with(
                self.w3,
                "Setup",
                mock_contract.functions.setup.return_value,
                EscrowClientError,
            )

    def test_setup_invalid_address(self):
        escrow_address = "test"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_setup_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )
        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.setup(escrow_address, escrow_config)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_setup_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.setup = MagicMock()
        mock_contract.functions.setup.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow not in Launched status state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(
            "Setup transaction failed: Escrow not in Launched status state",
            str(cm.exception),
        )

    def test_setup_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.setup = MagicMock()
        mock_contract.functions.setup.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(
            "Setup transaction failed: Address calling not trusted", str(cm.exception)
        )

    def test_setup_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_create_and_setup_escrow(self):
        mock_function_create = MagicMock()
        self.escrow.factory_contract.functions.createEscrow = mock_function_create
        mock_contract = MagicMock()
        mock_contract.functions.setup = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = [self.w3.eth.default_account]
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )
        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            with patch("human_protocol_sdk.escrow.next") as mock_function_next:
                mock_function_next.return_value = SimpleNamespace(
                    args=SimpleNamespace(escrow=escrow_address)
                )
                response = self.escrow.create_and_setup_escrow(
                    token_address, trusted_handlers, escrow_config
                )

                self.assertEqual(response, escrow_address)
                mock_function_create.assert_called_once_with(
                    token_address, trusted_handlers
                )
                mock_function_next.assert_called_once()

                mock_function.assert_any_call(
                    self.w3,
                    "Create Escrow",
                    mock_function_create.return_value,
                    EscrowClientError,
                )
                mock_function.assert_called_with(
                    self.w3,
                    "Setup",
                    mock_contract.functions.setup.return_value,
                    EscrowClientError,
                )

    def test_create_and_setup_escrow_invalid_token(self):
        self.escrow.setup = MagicMock()
        token_address = "invalid_address"
        trusted_handlers = [self.w3.eth.default_account]
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_and_setup_escrow(
                token_address, trusted_handlers, escrow_config
            )
        self.assertEqual(f"Invalid token address: {token_address}", str(cm.exception))
        self.escrow.setup.assert_not_called()

    def test_create_and_setup_escrow_invalid_handler(self):
        self.escrow.setup = MagicMock()
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = ["invalid_address"]
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_and_setup_escrow(
                token_address, trusted_handlers, escrow_config
            )
        self.assertEqual(
            f"Invalid handler address: {trusted_handlers[0]}", str(cm.exception)
        )
        self.escrow.setup.assert_not_called()

    def test_create_and_setup_escrow_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrowClient.setup = MagicMock()
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = ["0x1234567890123456789012345678901234567890"]
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            "http://localhost",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.create_and_setup_escrow(
                token_address, trusted_handlers, escrow_config
            )
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))
        escrowClient.setup.assert_not_called()

    def test_fund(self):
        escrow_address = token_address = "0x1234567890123456789012345678901234567890"
        amount = 100
        self.escrow.get_token_address = MagicMock(return_value=token_address)

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.fund(escrow_address, amount)

            self.escrow.get_token_address.assert_called_once_with(escrow_address)
            mock_function.assert_called_once()

    def test_fund_invalid_address(self):
        escrow_address = "invalid_address"
        amount = 100

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.fund(escrow_address, amount)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_fund_invalid_amount(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        amount = -2

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.fund(escrow_address, amount)
        self.assertEqual("Amount must be positive", str(cm.exception))

    def test_fund_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        escrow_address = token_address = "0x1234567890123456789012345678901234567890"
        amount = 100

        escrowClient.get_token_address = MagicMock(return_value=token_address)

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.fund(escrow_address, amount)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_store_results(self):
        mock_contract = MagicMock()
        mock_contract.functions.storeResults = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = "test"

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.store_results(escrow_address, url, hash)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.storeResults.assert_called_once_with(url, hash)
            mock_function.assert_called_once_with(
                self.w3,
                "Store Results",
                mock_contract.functions.storeResults.return_value,
                EscrowClientError,
            )

    def test_store_results_invalid_address(self):
        escrow_address = "invalid_address"
        url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_store_results_invalid_url(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "invalid_url"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(f"Invalid URL: {url}", str(cm.exception))

    def test_store_results_invalid_hash(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = ""

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual("Invalid empty hash", str(cm.exception))

    def test_store_results_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.store_results(escrow_address, url, hash)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_store_results_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.storeResults = MagicMock()
        mock_contract.functions.storeResults.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow not in Pending or Partial status state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(
            "Store Results transaction failed: Escrow not in Pending or Partial status state",
            str(cm.exception),
        )

    def test_store_results_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.storeResults = MagicMock()
        mock_contract.functions.storeResults.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(
            "Store Results transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_store_results_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "http://localhost"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(
            "Escrow address is not provided by the factory",
            str(cm.exception),
        )

    def test_bulk_payout(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.bulkPayOut.assert_called_once_with(
                recipients, amounts, final_results_url, final_results_hash, txId
            )
            mock_function.assert_called_once_with(
                self.w3,
                "Bulk Payout",
                mock_contract.functions.bulkPayOut.return_value,
                EscrowClientError,
            )

    def test_bulk_payout_invalid_address(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                "invalid_address",
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                ["invalid_address"],
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Invalid recipient address: invalid_address", str(cm.exception)
        )

    def test_bulk_payout_different_length_arrays(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100, 200]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Arrays must have same length", str(cm.exception))

    def test_bulk_payout_empty_arrays(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = []
        amounts = []
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Arrays must have any value", str(cm.exception))

    def test_bulk_payout_zero_amount(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                [0],
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Amounts cannot be empty", str(cm.exception))

    def test_bulk_payout_negative_amount(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                [-10],
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Amounts cannot be negative", str(cm.exception))

    def test_bulk_payout_not_enough_balance(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1
        self.escrow.get_balance = MagicMock(return_value=50)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Escrow does not have enough balance. Current balance: 50. Amounts: 100",
            str(cm.exception),
        )

    def test_bulk_payout_invalid_url(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "invalid_url"
        final_results_hash = "test"
        txId = 1
        self.escrow.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            f"Invalid final results URL: {final_results_url}", str(cm.exception)
        )

    def test_bulk_payout_invalid_hash(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = ""
        txId = 1
        self.escrow.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Invalid empty final results hash", str(cm.exception))

    def test_bulk_payout_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1
        escrowClient.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_bulk_payout_invalid_escrow_address(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_bulk_payout_exceed_max_count(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        mock_contract.functions.bulkPayOut.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Too many recipients'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Bulk Payout transaction failed: Too many recipients", str(cm.exception)
        )

    def test_bulk_payout_exceed_max_value(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        mock_contract.functions.bulkPayOut.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Bulk value too high'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Bulk Payout transaction failed: Bulk value too high", str(cm.exception)
        )

    def test_bulk_payout_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        mock_contract.functions.bulkPayOut.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Invalid status'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Bulk Payout transaction failed: Invalid status", str(cm.exception)
        )

    def test_bulk_payout_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        mock_contract.functions.bulkPayOut.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "http://localhost"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Bulk Payout transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_complete(self):
        mock_contract = MagicMock()
        mock_contract.functions.complete = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.complete(escrow_address)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.complete.assert_called_once_with()
            mock_function.assert_called_once_with(
                self.w3,
                "Complete",
                mock_contract.functions.complete.return_value,
                EscrowClientError,
            )

    def test_complete_invalid_address(self):
        escrow_address = "invalid_address"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.complete(escrow_address)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_complete_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.complete(escrow_address)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_complete_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.complete = MagicMock()
        mock_contract.functions.complete.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow not in Paid state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.complete(escrow_address)
        self.assertEqual(
            "Complete transaction failed: Escrow not in Paid state", str(cm.exception)
        )

    def test_complete_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.complete = MagicMock()
        mock_contract.functions.complete.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.complete(escrow_address)
        self.assertEqual(
            "Complete transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_complete_invalid_address(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.complete(escrow_address)
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_cancel(self):
        mock_contract = MagicMock()
        mock_contract.functions.cancel = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.cancel(escrow_address)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.cancel.assert_called_once_with()
            mock_function.assert_called_once_with(
                self.w3,
                "Cancel",
                mock_contract.functions.cancel.return_value,
                EscrowClientError,
            )

    def test_cancel_invalid_address(self):
        escrow_address = "invalid_address"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.cancel(escrow_address)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_cancel_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.cancel(escrow_address)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_cancel_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.cancel = MagicMock()
        mock_contract.functions.cancel.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow in Paid status state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.cancel(escrow_address)
        self.assertEqual(
            "Cancel transaction failed: Escrow in Paid status state", str(cm.exception)
        )

    def test_cancel_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.cancel = MagicMock()
        mock_contract.functions.cancel.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.cancel(escrow_address)
        self.assertEqual(
            "Cancel transaction failed: Address calling not trusted", str(cm.exception)
        )

    def test_cancel_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.cancel(escrow_address)
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_abort(self):
        mock_contract = MagicMock()
        mock_contract.functions.abort = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.abort(escrow_address)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.abort.assert_called_once_with()
            mock_function.assert_called_once_with(
                self.w3,
                "Abort",
                mock_contract.functions.abort.return_value,
                EscrowClientError,
            )

    def test_abort_invalid_address(self):
        escrow_address = "invalid_address"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.abort(escrow_address)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_abort_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.abort(escrow_address)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_abort_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.abort = MagicMock()
        mock_contract.functions.abort.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow in Paid status state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.abort(escrow_address)
        self.assertEqual(
            "Abort transaction failed: Escrow in Paid status state", str(cm.exception)
        )

    def test_abort_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.abort = MagicMock()
        mock_contract.functions.abort.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.abort(escrow_address)
        self.assertEqual(
            "Abort transaction failed: Address calling not trusted", str(cm.exception)
        )

    def test_abort_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.abort(escrow_address)
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_add_trusted_handlers(self):
        mock_contract = MagicMock()
        mock_contract.functions.addTrustedHandlers = MagicMock()
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        with patch("human_protocol_sdk.escrow.handle_transaction") as mock_function:
            self.escrow.add_trusted_handlers(escrow_address, handlers)

            self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
            mock_contract.functions.addTrustedHandlers.assert_called_once_with(handlers)
            mock_function.assert_called_once_with(
                self.w3,
                "Add Trusted Handlers",
                mock_contract.functions.addTrustedHandlers.return_value,
                EscrowClientError,
            )

    def test_add_trusted_handlers_invalid_address(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.add_trusted_handlers("invalid_address", handlers)
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.add_trusted_handlers(
                escrow_address,
                ["invalid_address", "0x1234567890123456789012345678901234567892"],
            )
        self.assertEqual(f"Invalid handler address: invalid_address", str(cm.exception))

    def test_add_trusted_handlers_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        with self.assertRaises(EscrowClientError) as cm:
            escrowClient.add_trusted_handlers(escrow_address, handlers)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_add_trusted_handlers_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.addTrustedHandlers = MagicMock()
        mock_contract.functions.addTrustedHandlers.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.add_trusted_handlers(escrow_address, handlers)
        self.assertEqual(
            "Add Trusted Handlers transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_add_trusted_handlers_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.add_trusted_handlers(escrow_address, handlers)
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_balance(self):
        mock_contract = MagicMock()
        mock_contract.functions.getBalance = MagicMock()
        mock_contract.functions.getBalance.return_value.call.return_value = 100
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_balance(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.getBalance.assert_called_once_with()
        self.assertEqual(result, 100)

    def test_get_balance_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_balance("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_balance_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.getBalance = MagicMock()
        mock_contract.functions.getBalance.return_value.call.return_value = 100
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_balance(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.getBalance.assert_called_once_with()
        self.assertEqual(result, 100)

    def test_get_balance_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_balance("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_manifest_url(self):
        mock_contract = MagicMock()
        mock_contract.functions.manifestUrl = MagicMock()
        mock_contract.functions.manifestUrl.return_value.call.return_value = (
            "mock_value"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_manifest_url(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.manifestUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_manifest_url_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_manifest_url("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_manifest_url_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.manifestUrl = MagicMock()
        mock_contract.functions.manifestUrl.return_value.call.return_value = (
            "mock_value"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_manifest_url(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.manifestUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_manifest_url_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_manifest_url("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_results_url(self):
        mock_contract = MagicMock()
        mock_contract.functions.finalResultsUrl = MagicMock()
        mock_contract.functions.finalResultsUrl.return_value.call.return_value = (
            "mock_value"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_results_url(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.finalResultsUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_results_url_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_results_url("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_results_url_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.finalResultsUrl = MagicMock()
        mock_contract.functions.finalResultsUrl.return_value.call.return_value = (
            "mock_value"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_results_url(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.finalResultsUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_results_url_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_results_url("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_token_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.token = MagicMock()
        mock_contract.functions.token.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_token_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.token.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_token_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_token_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_token_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.token = MagicMock()
        mock_contract.functions.token.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_token_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.token.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_token_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_token_address("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.status = MagicMock()
        mock_contract.functions.status.return_value.call.return_value = (
            Status.Launched.value
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_status(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.status.assert_called_once_with()
        self.assertEqual(result, Status.Launched)

    def test_get_status_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_status("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_status_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.status = MagicMock()
        mock_contract.functions.status.return_value.call.return_value = (
            Status.Launched.value
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_status(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.status.assert_called_once_with()
        self.assertEqual(result, Status.Launched)

    def test_get_status_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_status("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_launched_escrows(self):
        requester_address = "0x1234567890123456789012345678901234567890"
        mock_function = MagicMock()
        with patch("human_protocol_sdk.escrow.get_data_from_subgraph") as mock_function:
            mock_function.return_value = {
                "data": {
                    "launchedEscrows": [
                        {
                            "id": "0x1234567890123456789012345678901234567891",
                        },
                        {
                            "id": "0x1234567890123456789012345678901234567892",
                        },
                    ]
                }
            }
            launched_escrows = self.escrow.get_launched_escrows(requester_address)

            mock_function.assert_called_once_with(
                "subgraph_url",
                """
            {
                launchedEscrows(
                    where:{from:"0x1234567890123456789012345678901234567890"}
                ) {
                    id
                }
            }
            """,
            )

            self.assertEqual(len(launched_escrows), 2)
            self.assertEqual(
                launched_escrows[0], "0x1234567890123456789012345678901234567891"
            )
            self.assertEqual(
                launched_escrows[1], "0x1234567890123456789012345678901234567892"
            )

    def test_escrow_filter_valid_params(self):
        escrow_address = "0x1234567890123456789012345678901234567891"
        date_from = datetime.fromtimestamp(1683811973)
        date_to = datetime.fromtimestamp(1683812007)
        escrow_filter = EscrowFilter(
            address=escrow_address,
            status=Status.Pending,
            date_from=date_from,
            date_to=date_to,
        )

        self.assertEqual(escrow_filter.address, escrow_address)
        self.assertEqual(escrow_filter.status, Status.Pending)
        self.assertEqual(escrow_filter.date_from, date_from)
        self.assertEqual(escrow_filter.date_to, date_to)

    def test_escrow_filter_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            EscrowFilter(address="invalid_address")
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_escrow_filter_no_parameters(self):
        with self.assertRaises(EscrowClientError) as cm:
            EscrowFilter()
        self.assertEqual(
            "EscrowFilter class must have at least one parameter", str(cm.exception)
        )

    def test_escrow_filter_invalid_dates(self):
        with self.assertRaises(EscrowClientError) as cm:
            EscrowFilter(
                date_from=datetime.fromtimestamp(1683812007),
                date_to=datetime.fromtimestamp(1683811973),
            )
        self.assertEqual(
            f"Invalid dates: {datetime.fromtimestamp(1683812007)} must be earlier than {datetime.fromtimestamp(1683811973)}",
            str(cm.exception),
        )

    def test_get_filtered_escrows(self):
        filter = EscrowFilter(
            address="0x1234567890123456789012345678901234567891",
            status=Status.Pending,
            date_from=datetime.fromtimestamp(1683811973),
            date_to=datetime.fromtimestamp(1683812007),
        )
        mock_function = MagicMock()
        with patch("human_protocol_sdk.escrow.get_data_from_subgraph") as mock_function:
            mock_function.return_value = {
                "data": {
                    "launchedEscrows": [
                        {
                            "id": "0x1234567890123456789012345678901234567891",
                        },
                        {
                            "id": "0x1234567890123456789012345678901234567892",
                        },
                    ]
                }
            }
            filtered = self.escrow.get_escrows_filtered(filter)

            mock_function.assert_called_once_with(
                "subgraph_url",
                """
            {
                launchedEscrows(where:{from:"0x1234567890123456789012345678901234567891",status:"Pending",timestamp_gte:"1683811973",timestamp_lte:"1683812007",}
                ) {
                    id
                }
            }
            """,
            )

            self.assertEqual(len(filtered), 2)
            self.assertEqual(filtered[0], "0x1234567890123456789012345678901234567891")
            self.assertEqual(filtered[1], "0x1234567890123456789012345678901234567892")


if __name__ == "__main__":
    unittest.main(exit=True)
