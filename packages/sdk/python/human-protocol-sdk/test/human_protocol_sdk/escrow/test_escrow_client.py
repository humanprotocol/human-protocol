import unittest
from datetime import datetime
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from types import SimpleNamespace
from unittest.mock import ANY, MagicMock, PropertyMock, patch

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.decorators import RequiresSignerError
from human_protocol_sdk.escrow import EscrowClient, EscrowClientError, EscrowConfig
from human_protocol_sdk.filter import EscrowFilter, FilterError
from web3 import Web3
from web3.constants import ADDRESS_ZERO
from web3.middleware import SignAndSendRawMiddlewareBuilder
from web3.providers.rpc import HTTPProvider


class TestEscrowClient(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock(spec=HTTPProvider)
        self.w3 = Web3(self.mock_provider)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(DEFAULT_GAS_PAYER_PRIV),
            "SignAndSendRawMiddlewareBuilder",
            layer=0,
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

    def test_init_with_invalid_web3(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = None
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(EscrowClientError) as cm:
            EscrowClient(w3)
        self.assertEqual(f"Invalid Web3 Instance", str(cm.exception))

    def test_escrow_config_valid_params(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        exchange_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        exchange_oracle_fee = 10
        manifest_url = "https://www.example.com/result"
        hash = "test"

        escrow_config = EscrowConfig(
            recording_oracle_address,
            reputation_oracle_address,
            exchange_oracle_address,
            recording_oracle_fee,
            reputation_oracle_fee,
            exchange_oracle_fee,
            manifest_url,
            hash,
        )

        self.assertEqual(
            escrow_config.recording_oracle_address, recording_oracle_address
        )
        self.assertEqual(
            escrow_config.reputation_oracle_address, reputation_oracle_address
        )
        self.assertEqual(escrow_config.exchange_oracle_address, exchange_oracle_address)
        self.assertEqual(escrow_config.recording_oracle_fee, recording_oracle_fee)
        self.assertEqual(escrow_config.reputation_oracle_fee, reputation_oracle_fee)
        self.assertEqual(escrow_config.exchange_oracle_fee, exchange_oracle_fee)
        self.assertEqual(escrow_config.manifest_url, manifest_url)
        self.assertEqual(escrow_config.hash, hash)

    def test_escrow_config_valid_params_with_docker_network_url(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        exchange_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        exchange_oracle_fee = 10
        manifest_url = "http://test:6000"
        hash = "test"

        escrow_config = EscrowConfig(
            recording_oracle_address,
            reputation_oracle_address,
            exchange_oracle_address,
            recording_oracle_fee,
            reputation_oracle_fee,
            exchange_oracle_fee,
            manifest_url,
            hash,
        )

        self.assertEqual(
            escrow_config.recording_oracle_address, recording_oracle_address
        )
        self.assertEqual(
            escrow_config.reputation_oracle_address, reputation_oracle_address
        )
        self.assertEqual(escrow_config.exchange_oracle_address, exchange_oracle_address)
        self.assertEqual(escrow_config.recording_oracle_fee, recording_oracle_fee)
        self.assertEqual(escrow_config.reputation_oracle_fee, reputation_oracle_fee)
        self.assertEqual(escrow_config.exchange_oracle_fee, exchange_oracle_fee)
        self.assertEqual(escrow_config.manifest_url, manifest_url)
        self.assertEqual(escrow_config.hash, hash)

    def test_escrow_config_invalid_address(self):
        invalid_address = "invalid_address"
        valid_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        exchange_oracle_fee = 10
        manifest_url = "https://www.example.com/result"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                invalid_address,
                valid_address,
                valid_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                exchange_oracle_fee,
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
                valid_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                exchange_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(
            f"Invalid reputation oracle address: {invalid_address}", str(cm.exception)
        )

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                valid_address,
                valid_address,
                invalid_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                exchange_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(
            f"Invalid exchange oracle address: {invalid_address}", str(cm.exception)
        )

    def test_escrow_config_invalid_fee(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        exchange_oracle_address = "0x1234567890123456789012345678901234567890"
        valid_oracle_fee = 10
        manifest_url = "https://www.example.com/result"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                exchange_oracle_address,
                (-2),
                valid_oracle_fee,
                valid_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                exchange_oracle_address,
                1000,
                valid_oracle_fee,
                valid_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Fee must be between 0 and 100", str(cm.exception))

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                exchange_oracle_address,
                valid_oracle_fee,
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
                exchange_oracle_address,
                valid_oracle_fee,
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
                exchange_oracle_address,
                valid_oracle_fee,
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
                exchange_oracle_address,
                valid_oracle_fee,
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
                exchange_oracle_address,
                40,
                40,
                40,
                manifest_url,
                hash,
            )
        self.assertEqual("Total fee must be less than 100", str(cm.exception))

    def test_escrow_config_invalid_url(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        exchange_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        exchange_oracle_fee = 10
        manifest_url = "test"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                exchange_oracle_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                exchange_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual(f"Invalid manifest URL: {manifest_url}", str(cm.exception))

    def test_escrow_config_invalid_hash(self):
        recording_oracle_address = "0x1234567890123456789012345678901234567890"
        reputation_oracle_address = "0x1234567890123456789012345678901234567890"
        exchange_oracle_address = "0x1234567890123456789012345678901234567890"
        recording_oracle_fee = 10
        reputation_oracle_fee = 10
        exchange_oracle_fee = 10
        manifest_url = "https://www.example.com/result"
        hash = ""

        with self.assertRaises(EscrowClientError) as cm:
            EscrowConfig(
                recording_oracle_address,
                reputation_oracle_address,
                exchange_oracle_address,
                recording_oracle_fee,
                reputation_oracle_fee,
                exchange_oracle_fee,
                manifest_url,
                hash,
            )
        self.assertEqual("Invalid empty manifest hash", str(cm.exception))

    def test_create_escrow(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"
        job_requester_id = "job-requester"
        trusted_handlers = [self.w3.eth.default_account]

        mock_create = MagicMock()
        mock_create.transact.return_value = "tx_hash"
        self.escrow.factory_contract.functions.createEscrow = MagicMock(
            return_value=mock_create
        )
        mock_event = MagicMock()
        mock_event.args.escrow = escrow_address
        mock_events = MagicMock()
        mock_events.LaunchedV2().process_log.return_value = mock_event
        self.escrow.factory_contract.events = mock_events
        self.escrow.network["factory_address"] = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": [{"address": self.escrow.network["factory_address"]}]}
        )

        result = self.escrow.create_escrow(
            token_address, trusted_handlers, job_requester_id
        )

        self.escrow.factory_contract.functions.createEscrow.assert_called_once_with(
            token_address, trusted_handlers, job_requester_id
        )
        mock_create.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result, escrow_address)

    def test_create_escrow_invalid_token(self):
        token_address = "invalid_address"
        trusted_handlers = [self.w3.eth.default_account]
        job_requester_id = "job-requester"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_escrow(token_address, trusted_handlers, job_requester_id)
        self.assertEqual(f"Invalid token address: {token_address}", str(cm.exception))

    def test_create_escrow_invalid_handler(self):
        token_address = "0x1234567890123456789012345678901234567890"
        trusted_handlers = ["invalid_address"]
        job_requester_id = "job-requester"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_escrow(token_address, trusted_handlers, job_requester_id)
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
        job_requester_id = "job-requester"
        with self.assertRaises(RequiresSignerError) as cm:
            escrowClient.create_escrow(
                token_address, trusted_handlers, job_requester_id
            )
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_create_escrow_with_tx_options(self):
        mock_function_create = MagicMock()
        self.escrow.factory_contract.functions.createEscrow = mock_function_create
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"
        job_requester_id = "job-requester"
        trusted_handlers = [self.w3.eth.default_account]
        tx_options = {"gas": 50000}

        mock_create = MagicMock()
        mock_create.transact.return_value = "tx_hash"
        self.escrow.factory_contract.functions.createEscrow = MagicMock(
            return_value=mock_create
        )
        mock_event = MagicMock()
        mock_event.args.escrow = escrow_address
        mock_events = MagicMock()
        mock_events.LaunchedV2().process_log.return_value = mock_event
        self.escrow.factory_contract.events = mock_events
        self.escrow.network["factory_address"] = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": [{"address": self.escrow.network["factory_address"]}]}
        )

        result = self.escrow.create_escrow(
            token_address, trusted_handlers, job_requester_id, tx_options
        )

        self.escrow.factory_contract.functions.createEscrow.assert_called_once_with(
            token_address, trusted_handlers, job_requester_id
        )
        mock_create.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result, escrow_address)

    def test_setup(self):
        mock_contract = MagicMock()
        mock_setup = MagicMock()
        mock_setup.transact.return_value = "tx_hash"
        mock_contract.functions.setup = MagicMock(return_value=mock_setup)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
            "test",
        )

        self.escrow.setup(escrow_address, escrow_config)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.setup.assert_called_once_with(
            escrow_config.reputation_oracle_address,
            escrow_config.recording_oracle_address,
            escrow_config.exchange_oracle_address,
            escrow_config.reputation_oracle_fee,
            escrow_config.recording_oracle_fee,
            escrow_config.exchange_oracle_fee,
            escrow_config.manifest_url,
            escrow_config.hash,
        )
        mock_setup.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_setup_invalid_address(self):
        escrow_address = "test"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
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
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
            "test",
        )
        with self.assertRaises(RequiresSignerError) as cm:
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
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(
            "Transaction failed: Escrow not in Launched status state",
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
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
            "test",
        )

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.setup(escrow_address, escrow_config)
        self.assertEqual(
            "Transaction failed: Address calling not trusted", str(cm.exception)
        )

    def test_setup_with_tx_options(self):
        mock_contract = MagicMock()
        mock_setup = MagicMock()
        mock_setup.transact.return_value = "tx_hash"
        mock_contract.functions.setup = MagicMock(return_value=mock_setup)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        escrow_config = EscrowConfig(
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            "0x1234567890123456789012345678901234567890",
            10,
            10,
            10,
            "https://www.example.com/result",
            "test",
        )
        tx_options = {"gas": 50000}

        self.escrow.setup(escrow_address, escrow_config, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.setup.assert_called_once_with(
            escrow_config.reputation_oracle_address,
            escrow_config.recording_oracle_address,
            escrow_config.exchange_oracle_address,
            escrow_config.reputation_oracle_fee,
            escrow_config.recording_oracle_fee,
            escrow_config.exchange_oracle_fee,
            escrow_config.manifest_url,
            escrow_config.hash,
        )
        mock_setup.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_fund(self):
        escrow_address = token_address = "0x1234567890123456789012345678901234567890"
        amount = 100
        self.escrow.get_token_address = MagicMock(return_value=token_address)
        mock_token_contract = MagicMock()
        mock_transfer = MagicMock()
        mock_transfer.transact.return_value = "tx_hash"
        mock_token_contract.functions.transfer = MagicMock(return_value=mock_transfer)
        self.escrow.w3.eth.contract = MagicMock(return_value=mock_token_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.escrow.fund(escrow_address, amount)

        self.escrow.get_token_address.assert_called_once_with(escrow_address)
        mock_token_contract.functions.transfer.assert_called_once_with(
            escrow_address, amount
        )
        mock_transfer.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

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

        with self.assertRaises(RequiresSignerError) as cm:
            escrowClient.fund(escrow_address, amount)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_fund_with_tx_options(self):
        mock_function_create = MagicMock()
        self.escrow.factory_contract.functions.createEscrow = mock_function_create
        escrow_address = token_address = "0x1234567890123456789012345678901234567890"
        amount = 100
        tx_options = {"gas": 50000}
        self.escrow.get_token_address = MagicMock(return_value=token_address)
        mock_token_contract = MagicMock()
        mock_transfer = MagicMock()
        mock_transfer.transact.return_value = "tx_hash"
        mock_token_contract.functions.transfer = MagicMock(return_value=mock_transfer)
        self.escrow.w3.eth.contract = MagicMock(return_value=mock_token_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.escrow.fund(escrow_address, amount, tx_options)

        self.escrow.get_token_address.assert_called_once_with(escrow_address)
        mock_token_contract.functions.transfer.assert_called_once_with(
            escrow_address, amount
        )
        mock_transfer.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_store_results(self):
        mock_contract = MagicMock()
        mock_store = MagicMock()
        mock_store.transact.return_value = "tx_hash"
        mock_contract.functions.storeResults = MagicMock(return_value=mock_store)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "https://www.example.com/result"
        hash = "test"

        self.escrow.store_results(escrow_address, url, hash)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.storeResults.assert_called_once_with(url, hash)
        mock_store.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_store_results_invalid_address(self):
        escrow_address = "invalid_address"
        url = "https://www.example.com/result"
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
        url = "https://www.example.com/result"
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
        url = "https://www.example.com/result"
        hash = "test"

        with self.assertRaises(RequiresSignerError) as cm:
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
        url = "https://www.example.com/result"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(
            "Transaction failed: Escrow not in Pending or Partial status state",
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
        url = "https://www.example.com/result"
        hash = "test"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.store_results(escrow_address, url, hash)
        self.assertEqual(
            "Transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_store_results_with_tx_options(self):
        mock_contract = MagicMock()
        mock_store = MagicMock()
        mock_store.transact.return_value = "tx_hash"
        mock_contract.functions.storeResults = MagicMock(return_value=mock_store)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        url = "https://www.example.com/result"
        hash = "test"
        tx_options = {"gas": 50000}

        self.escrow.store_results(escrow_address, url, hash, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.storeResults.assert_called_once_with(url, hash)
        mock_store.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_bulk_payout(self):
        mock_contract = MagicMock()
        mock_bulk = MagicMock()
        mock_bulk.transact.return_value = "tx_hash"
        mock_contract.functions.bulkPayOut = MagicMock(return_value=mock_bulk)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

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
        mock_bulk.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_bulk_payout_with_force_complete(self):
        mock_contract = MagicMock()
        mock_bulk = MagicMock()
        mock_bulk.transact.return_value = "tx_hash"
        mock_contract.functions.bulkPayOut = MagicMock(return_value=mock_bulk)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        self.escrow.bulk_payout(
            escrow_address,
            recipients,
            amounts,
            final_results_url,
            final_results_hash,
            txId,
            True,
        )

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.bulkPayOut.assert_called_once_with(
            recipients, amounts, final_results_url, final_results_hash, txId, True
        )
        mock_bulk.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_bulk_payout_invalid_address(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
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

    def test_bulk_payout_exceed_max_count(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"] * 100
        amounts = [100] * 100
        final_results_url = "https://www.example.com/result"
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
        self.assertEqual("Too many recipients", str(cm.exception))

    def test_bulk_payout_zero_amount(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
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
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1
        escrowClient.get_balance = MagicMock(return_value=100)

        with self.assertRaises(RequiresSignerError) as cm:
            escrowClient.bulk_payout(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_bulk_payout_with_tx_options(self):
        mock_contract = MagicMock()
        mock_bulk = MagicMock()
        mock_bulk.transact.return_value = "tx_hash"
        mock_contract.functions.bulkPayOut = MagicMock(return_value=mock_bulk)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1
        tx_options = {"gas": 50000}

        self.escrow.bulk_payout(
            escrow_address,
            recipients,
            amounts,
            final_results_url,
            final_results_hash,
            txId,
            tx_options=tx_options,
        )

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.bulkPayOut.assert_called_once_with(
            recipients, amounts, final_results_url, final_results_hash, txId
        )
        mock_bulk.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_create_bulk_payout_transaction(self):
        mock_contract = MagicMock()
        mock_contract.functions.bulkPayOut = MagicMock()
        mock_contract.functions.bulkPayOut.return_value.build_transaction = MagicMock(
            return_value={
                "to": "0x1234567890123456789012345678901234567890",
                "data": "0x1234",
            }
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_balance = MagicMock(return_value=100)
        self.w3.eth.estimate_gas = MagicMock(return_value=100)

        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        result = self.escrow.create_bulk_payout_transaction(
            escrow_address,
            recipients,
            amounts,
            final_results_url,
            final_results_hash,
            txId,
        )

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.bulkPayOut.assert_called_once_with(
            recipients,
            amounts,
            final_results_url,
            final_results_hash,
            txId,
            False,
        )
        mock_contract.functions.bulkPayOut.return_value.build_transaction.assert_called_once()

        self.assertIn("to", result)
        self.assertIn("data", result)
        self.assertEqual(result["to"], "0x1234567890123456789012345678901234567890")
        self.assertEqual(result["data"], "0x1234")

    def test_create_bulk_payout_transaction_invalid_escrow_address(self):
        invalid_escrow_address = "invalid_address"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
                invalid_escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            f"Invalid escrow address: {invalid_escrow_address}", str(cm.exception)
        )

    def test_create_bulk_payout_transaction_empty_recipients(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = []
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Arrays must have any value", str(cm.exception))

    def test_create_bulk_payout_transaction_mismatched_lengths(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100, 200]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Arrays must have same length", str(cm.exception))

    def test_create_bulk_payout_transaction_insufficient_balance(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [200]
        final_results_url = "https://www.example.com/result"
        final_results_hash = "test"
        txId = 1

        self.escrow.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual(
            "Escrow does not have enough balance. Current balance: 100. Amounts: 200",
            str(cm.exception),
        )

    def test_create_bulk_payout_transaction_invalid_url(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "invalid_url"
        final_results_hash = "test"
        txId = 1
        self.escrow.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
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

    def test_create_bulk_payout_transaction_empty_hash(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        recipients = ["0x1234567890123456789012345678901234567890"]
        amounts = [100]
        final_results_url = "https://www.example.com/result"
        final_results_hash = ""
        txId = 1
        self.escrow.get_balance = MagicMock(return_value=100)

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.create_bulk_payout_transaction(
                escrow_address,
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                txId,
            )
        self.assertEqual("Invalid empty final results hash", str(cm.exception))

    def test_complete(self):
        mock_contract = MagicMock()
        mock_complete = MagicMock()
        mock_complete.transact.return_value = "tx_hash"
        mock_contract.functions.complete = MagicMock(return_value=mock_complete)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"

        self.escrow.complete(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.complete.assert_called_once_with()
        mock_complete.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
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

        with self.assertRaises(RequiresSignerError) as cm:
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
            "Transaction failed: Escrow not in Paid state", str(cm.exception)
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
            "Transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_complete_with_tx_options(self):
        mock_contract = MagicMock()
        mock_complete = MagicMock()
        mock_complete.transact.return_value = "tx_hash"
        mock_contract.functions.complete = MagicMock(return_value=mock_complete)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        tx_options = {"gas": 50000}

        self.escrow.complete(escrow_address, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.complete.assert_called_once_with()
        mock_complete.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_cancel(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567891"
        amount_refunded = 123

        # Mock contract and cancel function
        mock_contract = MagicMock()
        mock_cancel = MagicMock()
        mock_cancel.transact.return_value = "tx_hash"
        mock_contract.functions.cancel = MagicMock(return_value=mock_cancel)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_token_address = MagicMock(return_value=token_address)

        # Mock token contract and Transfer event
        token_contract = MagicMock()
        token_contract.events.Transfer().process_log.return_value = {
            "event": "Transfer",
            "args": {"from": escrow_address, "value": amount_refunded},
        }
        self.escrow.w3.eth.contract = MagicMock(return_value=token_contract)

        # Mock receipt with logs
        receipt = {"transactionHash": b"tx_hash", "logs": [{"address": token_address}]}
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value=receipt
        )

        result = self.escrow.cancel(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.cancel.assert_called_once_with()
        mock_cancel.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result.amountRefunded, amount_refunded)
        self.assertEqual(result.txHash, receipt["transactionHash"].hex())

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

        with self.assertRaises(RequiresSignerError) as cm:
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
            "Transaction failed: Escrow in Paid status state", str(cm.exception)
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
            "Transaction failed: Address calling not trusted", str(cm.exception)
        )

    def test_cancel_with_tx_options(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567891"
        amount_refunded = 123
        tx_options = {"gas": 50000}

        # Mock contract and cancel function
        mock_contract = MagicMock()
        mock_cancel = MagicMock()
        mock_cancel.transact.return_value = "tx_hash"
        mock_contract.functions.cancel = MagicMock(return_value=mock_cancel)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.get_token_address = MagicMock(return_value=token_address)

        # Mock token contract and Transfer event
        token_contract = MagicMock()
        token_contract.events.Transfer().process_log.return_value = {
            "event": "Transfer",
            "args": {"from": escrow_address, "value": amount_refunded},
        }
        self.escrow.w3.eth.contract = MagicMock(return_value=token_contract)

        # Mock receipt with logs
        receipt = {"transactionHash": b"tx_hash", "logs": [{"address": token_address}]}
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value=receipt
        )

        result = self.escrow.cancel(escrow_address, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.cancel.assert_called_once_with()
        mock_cancel.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result.amountRefunded, amount_refunded)
        self.assertEqual(result.txHash, receipt["transactionHash"].hex())

    def test_add_trusted_handlers(self):
        mock_contract = MagicMock()
        mock_add = MagicMock()
        mock_add.transact.return_value = "tx_hash"
        mock_contract.functions.addTrustedHandlers = MagicMock(return_value=mock_add)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]

        self.escrow.add_trusted_handlers(escrow_address, handlers)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.addTrustedHandlers.assert_called_once_with(handlers)
        mock_add.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
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

        with self.assertRaises(RequiresSignerError) as cm:
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
            "Transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_add_trusted_handlers_with_tx_options(self):
        mock_contract = MagicMock()
        mock_add = MagicMock()
        mock_add.transact.return_value = "tx_hash"
        mock_contract.functions.addTrustedHandlers = MagicMock(return_value=mock_add)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        escrow_address = "0x1234567890123456789012345678901234567890"
        handlers = [
            "0x1234567890123456789012345678901234567891",
            "0x1234567890123456789012345678901234567892",
        ]
        tx_options = {"gas": 50000}

        self.escrow.add_trusted_handlers(escrow_address, handlers, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.addTrustedHandlers.assert_called_once_with(handlers)
        mock_add.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_withdraw(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567891"
        amount_withdrawn = 123

        # Mock contract and withdraw function
        mock_contract = MagicMock()
        mock_withdraw = MagicMock()
        mock_withdraw.transact.return_value = "tx_hash"
        mock_contract.functions.withdraw = MagicMock(return_value=mock_withdraw)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)

        # Mock token contract and Transfer event
        token_contract = MagicMock()
        token_contract.events.Transfer().process_log.return_value = {
            "event": "Transfer",
            "args": {"from": escrow_address, "value": amount_withdrawn},
        }
        self.escrow.w3.eth.contract = MagicMock(return_value=token_contract)

        # Mock receipt with logs
        receipt = {"transactionHash": b"tx_hash", "logs": [{"address": token_address}]}
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value=receipt
        )

        result = self.escrow.withdraw(escrow_address, token_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.withdraw.assert_called_once_with(token_address)
        mock_withdraw.transact.assert_called_once_with({})
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result.amountWithdrawn, amount_withdrawn)
        self.assertEqual(result.tokenAddress, token_address)
        self.assertEqual(result.txHash, receipt["transactionHash"].hex())

    def test_withdraw_invalid_escrow_address(self):
        escrow_address = "invalid_address"
        token_address = "0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.withdraw(escrow_address, token_address)
        self.assertEqual(f"Invalid escrow address: {escrow_address}", str(cm.exception))

    def test_withdraw_invalid_token_address(self):
        escrow_address = "0xa76507AbFE3B67cB25F16DbC75a883D4190B7e46"
        token_address = "invalid_address"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.withdraw(escrow_address, token_address)
        self.assertEqual(f"Invalid token address: {token_address}", str(cm.exception))

    def test_withdraw_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)

        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(RequiresSignerError) as cm:
            escrowClient.withdraw(escrow_address, token_address)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_withdraw_invalid_status(self):
        mock_contract = MagicMock()
        mock_contract.functions.withdraw = MagicMock()
        mock_contract.functions.withdraw.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Escrow in Paid status state'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.withdraw(escrow_address, token_address)
        self.assertEqual(
            "Transaction failed: Escrow in Paid status state",
            str(cm.exception),
        )

    def test_withdraw_invalid_caller(self):
        mock_contract = MagicMock()
        mock_contract.functions.withdraw = MagicMock()
        mock_contract.functions.withdraw.return_value.transact.side_effect = Exception(
            "Error: VM Exception while processing transaction: reverted with reason string 'Address calling not trusted'."
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567890"

        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.withdraw(escrow_address, token_address)
        self.assertEqual(
            "Transaction failed: Address calling not trusted",
            str(cm.exception),
        )

    def test_withdraw_with_tx_options(self):
        escrow_address = "0x1234567890123456789012345678901234567890"
        token_address = "0x1234567890123456789012345678901234567891"
        amount_withdrawn = 123
        tx_options = {"gas": 50000}

        # Mock contract and withdraw function
        mock_contract = MagicMock()
        mock_withdraw = MagicMock()
        mock_withdraw.transact.return_value = "tx_hash"
        mock_contract.functions.withdraw = MagicMock(return_value=mock_withdraw)
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)

        # Mock token contract and Transfer event
        token_contract = MagicMock()
        token_contract.events.Transfer().process_log.return_value = {
            "event": "Transfer",
            "args": {"from": escrow_address, "value": amount_withdrawn},
        }
        self.escrow.w3.eth.contract = MagicMock(return_value=token_contract)

        # Mock receipt with logs
        receipt = {"transactionHash": b"tx_hash", "logs": [{"address": token_address}]}
        self.escrow.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value=receipt
        )

        result = self.escrow.withdraw(escrow_address, token_address, tx_options)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.withdraw.assert_called_once_with(token_address)
        mock_withdraw.transact.assert_called_once_with(tx_options)
        self.escrow.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )
        self.assertEqual(result.amountWithdrawn, amount_withdrawn)
        self.assertEqual(result.tokenAddress, token_address)
        self.assertEqual(result.txHash, receipt["transactionHash"].hex())

    def test_get_balance(self):
        mock_contract = MagicMock()
        mock_contract.functions.getBalance = MagicMock()
        mock_remaining_funds = MagicMock()
        mock_remaining_funds.side_effect = Exception("Test")
        mock_contract.functions.remainingFunds = mock_remaining_funds
        mock_contract.functions.getBalance.return_value.call.return_value = 100
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_balance(escrow_address)

        self.escrow._get_escrow_contract.assert_called_with(escrow_address)
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
        mock_remaining_funds = MagicMock()
        mock_remaining_funds.side_effect = Exception("Test")
        mock_contract.functions.remainingFunds = mock_remaining_funds
        mock_contract.functions.getBalance = MagicMock()
        mock_contract.functions.getBalance.return_value.call.return_value = 100
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_balance(escrow_address)

        escrowClient._get_escrow_contract.assert_called_with(escrow_address)
        mock_contract.functions.getBalance.assert_called_once_with()
        self.assertEqual(result, 100)

    def test_get_balance_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_balance("0x1234567890123456789012345678901234567890")
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_balance_new_escrow(self):
        mock_contract = MagicMock()
        mock_contract.functions.remainingFunds = MagicMock()
        mock_contract.functions.remainingFunds.return_value.call.return_value = 100
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_balance(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.remainingFunds.assert_called_once_with()
        self.assertEqual(result, 100)

    def test_get_manifest_hash(self):
        mock_contract = MagicMock()
        mock_contract.functions.manifestHash = MagicMock()
        mock_contract.functions.manifestHash.return_value.call.return_value = (
            "mock_value"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_manifest_hash(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.manifestHash.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_manifest_hash_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_manifest_hash("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

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

    def test_get_intermediate_results_url(self):
        mock_contract = MagicMock()
        mock_contract.functions.intermediateResultsUrl = MagicMock()
        mock_contract.functions.intermediateResultsUrl.return_value.call.return_value = (
            "mock_value"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_intermediate_results_url(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.intermediateResultsUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_intermediate_results_url_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_intermediate_results_url("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_intermediate_results_url_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.intermediateResultsUrl = MagicMock()
        mock_contract.functions.intermediateResultsUrl.return_value.call.return_value = (
            "mock_value"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_intermediate_results_url(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.intermediateResultsUrl.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_intermediate_results_url_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_intermediate_results_url(
                "0x1234567890123456789012345678901234567890"
            )
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

    def test_escrow_filter_valid_params(self):
        launcher = "0x1234567890123456789012345678901234567891"
        reputation_oracle = "0x1234567890123456789012345678901234567891"
        recording_oracle = "0x1234567890123456789012345678901234567891"
        date_from = datetime.fromtimestamp(1683811973)
        date_to = datetime.fromtimestamp(1683812007)
        escrow_filter = EscrowFilter(
            chain_id=ChainId.POLYGON_AMOY,
            launcher=launcher,
            reputation_oracle=reputation_oracle,
            recording_oracle=recording_oracle,
            status=Status.Pending,
            date_from=date_from,
            date_to=date_to,
        )

        self.assertEqual(escrow_filter.launcher, launcher)
        self.assertEqual(escrow_filter.reputation_oracle, reputation_oracle)
        self.assertEqual(escrow_filter.recording_oracle, recording_oracle)
        self.assertEqual(escrow_filter.status, Status.Pending)
        self.assertEqual(escrow_filter.date_from, date_from)
        self.assertEqual(escrow_filter.date_to, date_to)

    def test_escrow_filter_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            EscrowFilter(chain_id=ChainId(123))
        self.assertEqual("123 is not a valid ChainId", str(cm.exception))

    def test_escrow_filter_invalid_address_launcher(self):
        with self.assertRaises(FilterError) as cm:
            EscrowFilter(chain_id=ChainId.POLYGON_AMOY, launcher="invalid_address")
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_escrow_filter_invalid_address_reputation_oracle(self):
        with self.assertRaises(FilterError) as cm:
            EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                reputation_oracle="invalid_address",
            )
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_escrow_filter_invalid_address_recording_oracle(self):
        with self.assertRaises(FilterError) as cm:
            EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                recording_oracle="invalid_address",
            )
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_escrow_filter_invalid_dates(self):
        with self.assertRaises(FilterError) as cm:
            EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                date_from=datetime.fromtimestamp(1683812007),
                date_to=datetime.fromtimestamp(1683811973),
            )
        self.assertEqual(
            f"Invalid dates: {datetime.fromtimestamp(1683812007)} must be earlier than {datetime.fromtimestamp(1683811973)}",
            str(cm.exception),
        )

    def test_get_recording_oracle_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.recordingOracle = MagicMock()
        mock_contract.functions.recordingOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_recording_oracle_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.recordingOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_recording_oracle_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_recording_oracle_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_recording_oracle_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.recordingOracle = MagicMock()
        mock_contract.functions.recordingOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_recording_oracle_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.recordingOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_recording_oracle_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_recording_oracle_address(
                "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_reputation_oracle_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.reputationOracle = MagicMock()
        mock_contract.functions.reputationOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_reputation_oracle_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.reputationOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_reputation_oracle_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_reputation_oracle_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_reputation_oracle_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.reputationOracle = MagicMock()
        mock_contract.functions.reputationOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_reputation_oracle_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.reputationOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_reputation_oracle_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_reputation_oracle_address(
                "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_exchange_oracle_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.exchangeOracle = MagicMock()
        mock_contract.functions.exchangeOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_exchange_oracle_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.exchangeOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_exchange_oracle_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_exchange_oracle_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_exchange_oracle_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.exchangeOracle = MagicMock()
        mock_contract.functions.exchangeOracle.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_exchange_oracle_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.exchangeOracle.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_exchange_oracle_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_exchange_oracle_address(
                "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_job_launcher_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.launcher = MagicMock()
        mock_contract.functions.launcher.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_job_launcher_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.launcher.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_job_launcher_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_job_launcher_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_job_launcher_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.launcher = MagicMock()
        mock_contract.functions.launcher.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_job_launcher_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.launcher.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_job_launcher_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_job_launcher_address(
                "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )

    def test_get_factory_address(self):
        mock_contract = MagicMock()
        mock_contract.functions.escrowFactory = MagicMock()
        mock_contract.functions.escrowFactory.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        self.escrow._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = self.escrow.get_factory_address(escrow_address)

        self.escrow._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.escrowFactory.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_factory_address_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_factory_address("invalid_address")
        self.assertEqual(f"Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_factory_address_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        escrowClient = EscrowClient(w3)
        mock_contract = MagicMock()
        mock_contract.functions.escrowFactory = MagicMock()
        mock_contract.functions.escrowFactory.return_value.call.return_value = (
            "0x1234567890123456789012345678901234567890"
        )
        escrowClient._get_escrow_contract = MagicMock(return_value=mock_contract)
        escrow_address = "0x1234567890123456789012345678901234567890"

        result = escrowClient.get_factory_address(escrow_address)

        escrowClient._get_escrow_contract.assert_called_once_with(escrow_address)
        mock_contract.functions.escrowFactory.assert_called_once_with()
        self.assertEqual(result, "0x1234567890123456789012345678901234567890")

    def test_get_factory_address_invalid_escrow(self):
        self.escrow.factory_contract.functions.hasEscrow = MagicMock(return_value=False)
        with self.assertRaises(EscrowClientError) as cm:
            self.escrow.get_factory_address(
                "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual(
            "Escrow address is not provided by the factory", str(cm.exception)
        )


if __name__ == "__main__":
    unittest.main(exit=True)
