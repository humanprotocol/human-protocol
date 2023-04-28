import unittest

from human_protocol_sdk.constants import NETWORKS
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from unittest.mock import MagicMock, PropertyMock

from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError
from human_protocol_sdk.constants import ChainId
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware


class KVStoreTestCase(unittest.TestCase):
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

        self.kvstore = KVStoreClient(self.w3)

    def test_init_with_valid_inputs(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        self.assertEqual(kvstore.w3, w3)
        self.assertEqual(kvstore.network, NETWORKS[ChainId(mock_chain_id)])
        self.assertIsNotNone(kvstore.kvstore_contract)

    def test_init_with_invalid_chain_id(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = 9999
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(KVStoreClientError):
            KVStoreClient(w3)

    def test_set(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.set = mock_function
        self.kvstore._handle_transaction = MagicMock()
        key = "key"
        value = "value"

        self.kvstore.set(key, value)

        mock_function.assert_called_once_with(key, value)
        self.kvstore._handle_transaction.assert_called_once_with(
            "Set", mock_function.return_value
        )

    def test_set_empty_key(self):
        key = ""
        value = "value"
        with self.assertRaises(KVStoreClientError):
            self.kvstore.set(key, value)

    def test_set_empty_value(self):
        key = "key"
        value = ""
        with self.assertRaises(KVStoreClientError):
            self.kvstore.set(key, value)

    def test_set_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        key = "key"
        value = "value"
        with self.assertRaises(KVStoreClientError):
            kvstore.set(key, value)

    def test_set_bulk(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function
        self.kvstore._handle_transaction = MagicMock()
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value2", "value3"]

        self.kvstore.set_bulk(keys, values)

        mock_function.assert_called_once_with(keys, values)
        self.kvstore._handle_transaction.assert_called_once_with(
            "Set Bulk", mock_function.return_value
        )

    def test_set_bulk_empty_key(self):
        keys = ["key1", "", "key3"]
        values = ["value1", "value2", "value3"]
        with self.assertRaises(KVStoreClientError):
            self.kvstore.set_bulk(keys, values)

    def test_set_bulk_empty_value(self):
        keys = ["key1", "key2", "key3"]
        values = ["value1", "", "value3"]
        with self.assertRaises(KVStoreClientError):
            self.kvstore.set_bulk(keys, values)

    def test_set_bulk_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        keys = ["key1", "key2", "key3"]
        values = ["value1", "", "value3"]
        with self.assertRaises(KVStoreClientError):
            kvstore.set_bulk(keys, values)

    def test_get(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
        key = "key"

        result = self.kvstore.get(address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_empty_key(self):
        address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
        key = ""
        with self.assertRaises(KVStoreClientError):
            self.kvstore.get(address, key)

    def test_get_invalid_address(self):
        address = "invalid_address"
        key = "key"
        with self.assertRaises(KVStoreClientError):
            self.kvstore.get(address, key)

    def test_get_empty_value(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
        key = "key"

        with self.assertRaises(KVStoreClientError):
            self.kvstore.get(address, key)

    def test_get_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.toChecksumAddress("0x1234567890123456789012345678901234567890")
        key = "key"

        result = kvstore.get(address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")


if __name__ == "__main__":
    unittest.main(exit=True)
