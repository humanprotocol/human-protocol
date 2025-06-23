import unittest

from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from unittest.mock import MagicMock, PropertyMock, patch

from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError
from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.decorators import RequiresSignerError
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from web3.middleware import SignAndSendRawMiddlewareBuilder


class TestKVStoreClient(unittest.TestCase):
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

        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreClient(w3)
        self.assertEqual("Invalid ChainId: 9999", str(cm.exception))

    def test_init_with_invalid_web3(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = None
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreClient(w3)
        self.assertEqual(f"Invalid Web3 Instance", str(cm.exception))

    def test_set(self):
        mock_set = MagicMock()
        mock_set.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.set = MagicMock(return_value=mock_set)
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        key = "key"
        value = "value"

        self.kvstore.set(key, value)

        self.kvstore.kvstore_contract.functions.set.assert_called_once_with(key, value)
        mock_set.transact.assert_called_once_with({})
        self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_set_empty_key(self):
        key = ""
        value = "value"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set(key, value)
        self.assertEqual("Key cannot be empty", str(cm.exception))

    def test_set_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        key = "key"
        value = "value"
        with self.assertRaises(RequiresSignerError) as cm:
            kvstore.set(key, value)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_with_tx_options(self):
        mock_set = MagicMock()
        mock_set.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.set = MagicMock(return_value=mock_set)
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        key = "key"
        value = "value"
        tx_options = {"gas": 50000}

        self.kvstore.set(key, value, tx_options)

        self.kvstore.kvstore_contract.functions.set.assert_called_once_with(key, value)
        mock_set.transact.assert_called_once_with(tx_options)
        self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_set_bulk(self):
        mock_set_bulk = MagicMock()
        mock_set_bulk.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.setBulk = MagicMock(
            return_value=mock_set_bulk
        )
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value2", "value3"]

        self.kvstore.set_bulk(keys, values)

        self.kvstore.kvstore_contract.functions.setBulk.assert_called_once_with(
            keys, values
        )
        mock_set_bulk.transact.assert_called_once_with({})
        self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_set_bulk_empty_key(self):
        keys = ["key1", "", "key3"]
        values = ["value1", "value2", "value3"]
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_bulk(keys, values)
        self.assertEqual("Key cannot be empty", str(cm.exception))

    def test_set_bulk_different_length_array(self):
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value3"]
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_bulk(keys, values)
        self.assertEqual("Arrays must have the same length", str(cm.exception))

    def test_set_bulk_empty_array(self):
        keys = []
        values = ["value1", "value2", "value3"]
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_bulk(keys, values)
        self.assertEqual("Arrays must have any value", str(cm.exception))

    def test_set_bulk_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        keys = ["key1", "key2", "key3"]
        values = ["value1", "", "value3"]
        with self.assertRaises(RequiresSignerError) as cm:
            kvstore.set_bulk(keys, values)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_bulk_with_tx_options(self):
        mock_set_bulk = MagicMock()
        mock_set_bulk.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.setBulk = MagicMock(
            return_value=mock_set_bulk
        )
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value2", "value3"]
        tx_options = {"gas": 50000}

        self.kvstore.set_bulk(keys, values, tx_options)

        self.kvstore.kvstore_contract.functions.setBulk.assert_called_once_with(
            keys, values
        )
        mock_set_bulk.transact.assert_called_once_with(tx_options)
        self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_set_file_url_and_hash(self):
        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()

        mock_set_bulk = MagicMock()
        mock_set_bulk.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.setBulk = MagicMock(
            return_value=mock_set_bulk
        )
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url)

            self.kvstore.kvstore_contract.functions.setBulk.assert_called_once_with(
                ["url", "url_hash"], [url, content_hash]
            )
            mock_set_bulk.transact.assert_called_once_with({})
            self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
                "tx_hash"
            )

    def test_set_file_url_and_hash_with_key(self):
        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()

        mock_set_bulk = MagicMock()
        mock_set_bulk.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.setBulk = MagicMock(
            return_value=mock_set_bulk
        )
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url, "linkedin_url")

            self.kvstore.kvstore_contract.functions.setBulk.assert_called_once_with(
                ["linkedin_url", "linkedin_url_hash"], [url, content_hash]
            )

            mock_set_bulk.transact.assert_called_once_with({})
            self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with

    def test_set_file_url_and_hash_invalid_url(self):
        invalid_url = "example.com"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_file_url_and_hash(invalid_url)
        self.assertEqual("Invalid URL: example.com", str(cm.exception))

    def test_set_file_url_and_hash_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        url = "https://example.com"
        with self.assertRaises(RequiresSignerError) as cm:
            kvstore.set_file_url_and_hash(url)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_file_url_and_hash_with_tx_options(self):
        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()
        tx_options = {"gas": 50000}

        mock_set_bulk = MagicMock()
        mock_set_bulk.transact.return_value = "tx_hash"
        self.kvstore.kvstore_contract.functions.setBulk = MagicMock(
            return_value=mock_set_bulk
        )
        self.kvstore.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url, tx_options=tx_options)

            self.kvstore.kvstore_contract.functions.setBulk.assert_called_once_with(
                ["url", "url_hash"], [url, content_hash]
            )
            mock_set_bulk.transact.assert_called_once_with(tx_options)
            self.kvstore.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
                "tx_hash"
            )


if __name__ == "__main__":
    unittest.main(exit=True)
