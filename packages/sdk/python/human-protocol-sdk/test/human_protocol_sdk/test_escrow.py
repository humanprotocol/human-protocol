import unittest

from human_protocol_sdk.constants import NETWORKS
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from unittest.mock import MagicMock, PropertyMock

from human_protocol_sdk.escrow import EscrowClient, EscrowClientError
from human_protocol_sdk.staking import StakingClient
from human_protocol_sdk.constants import ChainId
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware


class EscrowTestCase(unittest.TestCase):
    def setUp(self):
        # self.mock_provider = MagicMock(spec=HTTPProvider)
        # self.w3 = Web3(self.mock_provider)

        # # Set default gas payer
        # self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        # self.w3.middleware_onion.add(
        #     construct_sign_and_send_raw_middleware(self.gas_payer)
        # )
        # self.w3.eth.default_account = self.gas_payer.address

        # self.mock_chain_id = ChainId.LOCALHOST.value
        # type(self.w3.eth).chain_id = PropertyMock(
        #     return_value=self.mock_chain_id)

        # self.escrow = EscrowClient(self.w3)

        self.mock_provider = HTTPProvider()
        self.w3 = Web3(self.mock_provider)
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer)
        )
        self.w3.eth.default_account = self.gas_payer.address
        self.escrow = EscrowClient(self.w3)
        self.staking = StakingClient(self.w3)

    # def test_init_with_valid_inputs(self):
    #     mock_provider = MagicMock(spec=HTTPProvider)
    #     w3 = Web3(mock_provider)

    #     mock_chain_id = ChainId.LOCALHOST.value
    #     type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

    #     escrow = EscrowClient(w3)

    #     self.assertEqual(escrow.w3, w3)
    #     self.assertEqual(escrow.network, NETWORKS[ChainId(mock_chain_id)])
    #     self.assertIsNotNone(escrow.factory_contract)

    # def test_init_with_invalid_chain_id(self):
    #     mock_provider = MagicMock(spec=HTTPProvider)
    #     w3 = Web3(mock_provider)

    #     mock_chain_id = 9999
    #     type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

    #     with self.assertRaises(EscrowClientError):
    #         EscrowClient(w3)

    def test_create(self):
        self.staking.approve_stake(1)
        self.staking.stake(1)
        print(
            self.escrow.createEscrow(
                NETWORKS[ChainId.LOCALHOST]["hmt_address"],
                [self.w3.eth.default_account],
            )
        )

    # def test_set_empty_key(self):
    #     key = ""
    #     value = "value"
    #     with self.assertRaises(EscrowClientError):
    #         self.escrow.set(key, value)

    # def test_set_without_account(self):
    #     mock_provider = MagicMock(spec=HTTPProvider)
    #     w3 = Web3(mock_provider)
    #     mock_chain_id = ChainId.LOCALHOST.value
    #     type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

    #     kvstore = EscrowClient(w3)

    #     key = "key"
    #     value = "value"
    #     with self.assertRaises(EscrowClientError):
    #         kvstore.set(key, value)

    # def test_set_bulk(self):
    #     mock_function = MagicMock()
    #     self.escrow.kvstore_contract.functions.setBulk = mock_function
    #     self.escrow._handle_transaction = MagicMock()
    #     keys = ["key1", "key2", "key3"]
    #     values = ["value1", "value2", "value3"]

    #     self.escrow.set_bulk(keys, values)

    #     mock_function.assert_called_once_with(keys, values)
    #     self.escrow._handle_transaction.assert_called_once_with(
    #         "Set Bulk", mock_function.return_value
    #     )

    # def test_set_bulk_empty_key(self):
    #     keys = ["key1", "", "key3"]
    #     values = ["value1", "value2", "value3"]
    #     with self.assertRaises(EscrowClientError):
    #         self.escrow.set_bulk(keys, values)

    #         self.escrow.set_bulk(keys, values)

    # def test_set_bulk_different_length_array(self):
    #     keys = ["key1", "key2", "key3"]
    #     values = ["value1", "value3"]
    #     with self.assertRaises(EscrowClientError):
    #         self.escrow.set_bulk(keys, values)

    # def test_set_bulk_without_account(self):
    #     mock_provider = MagicMock(spec=HTTPProvider)
    #     w3 = Web3(mock_provider)
    #     mock_chain_id = ChainId.LOCALHOST.value
    #     type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

    #     kvstore = EscrowClient(w3)

    #     keys = ["key1", "key2", "key3"]
    #     values = ["value1", "", "value3"]
    #     with self.assertRaises(EscrowClientError):
    #         kvstore.set_bulk(keys, values)

    # def test_get(self):
    #     mock_function = MagicMock()
    #     mock_function.return_value.call.return_value = "mock_value"
    #     self.escrow.kvstore_contract.functions.get = mock_function
    #     address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
    #     key = "key"

    #     result = self.escrow.get(address, key)

    #     mock_function.assert_called_once_with(address, key)
    #     mock_function.return_value.call.assert_called_once_with()
    #     self.assertEqual(result, "mock_value")

    # def test_get_empty_key(self):
    #     address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
    #     key = ""
    #     with self.assertRaises(EscrowClientError):
    #         self.escrow.get(address, key)

    # def test_get_invalid_address(self):
    #     address = "invalid_address"
    #     key = "key"
    #     with self.assertRaises(EscrowClientError):
    #         self.escrow.get(address, key)

    # def test_get_empty_value(self):
    #     mock_function = MagicMock()
    #     mock_function.return_value.call.return_value = ""
    #     self.escrow.kvstore_contract.functions.get = mock_function
    #     address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
    #     key = "key"

    #     result = self.escrow.get(address, key)

    #     mock_function.assert_called_once_with(address, key)
    #     mock_function.return_value.call.assert_called_once_with()
    #     self.assertEqual(result, "")

    # def test_get_without_account(self):
    #     mock_provider = MagicMock(spec=HTTPProvider)
    #     w3 = Web3(mock_provider)
    #     mock_chain_id = ChainId.LOCALHOST.value
    #     type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

    #     kvstore = EscrowClient(w3)

    #     mock_function = MagicMock()
    #     mock_function.return_value.call.return_value = "mock_value"
    #     kvstore.kvstore_contract.functions.get = mock_function

    #     address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
    #     key = "key"

    #     result = kvstore.get(address, key)

    #     mock_function.assert_called_once_with(address, key)
    #     mock_function.return_value.call.assert_called_once_with()
    #     self.assertEqual(result, "mock_value")


if __name__ == "__main__":
    unittest.main(exit=True)
