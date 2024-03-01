import unittest

from human_protocol_sdk.constants import NETWORKS
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER_PRIV
from unittest.mock import MagicMock, PropertyMock, patch

from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError
from human_protocol_sdk.constants import ChainId
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware


class TestKVStoreClient(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock(spec=HTTPProvider)
        self.w3 = Web3(self.mock_provider)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer),
            "construct_sign_and_send_raw_middleware",
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
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.set = mock_function
        key = "key"
        value = "value"

        with patch(
            "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
        ) as mock_handle_transaction:
            self.kvstore.set(key, value)

            mock_function.assert_called_once_with(key, value)
            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set",
                mock_function.return_value,
                KVStoreClientError,
                None,
            )

    def test_set_empty_key(self):
        key = ""
        value = "value"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set(key, value)
        self.assertEqual("Key can not be empty", str(cm.exception))

    def test_set_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        key = "key"
        value = "value"
        with self.assertRaises(KVStoreClientError) as cm:
            kvstore.set(key, value)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_with_tx_options(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.set = mock_function
        key = "key"
        value = "value"
        tx_options = {"gas": 50000}

        with patch(
            "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
        ) as mock_handle_transaction:
            self.kvstore.set(key, value, tx_options)

            mock_function.assert_called_once_with(key, value)
            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set",
                mock_function.return_value,
                KVStoreClientError,
                tx_options,
            )

    def test_set_bulk(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value2", "value3"]

        with patch(
            "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
        ) as mock_handle_transaction:
            self.kvstore.set_bulk(keys, values)

            mock_function.assert_called_once_with(keys, values)
            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set Bulk",
                mock_function.return_value,
                KVStoreClientError,
                None,
            )

    def test_set_bulk_empty_key(self):
        keys = ["key1", "", "key3"]
        values = ["value1", "value2", "value3"]
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_bulk(keys, values)
        self.assertEqual("Key can not be empty", str(cm.exception))

    def test_set_bulk_different_length_array(self):
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value3"]
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.set_bulk(keys, values)
        self.assertEqual("Arrays must have same length", str(cm.exception))

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
        with self.assertRaises(KVStoreClientError) as cm:
            kvstore.set_bulk(keys, values)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_bulk_with_tx_options(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function
        keys = ["key1", "key2", "key3"]
        values = ["value1", "value2", "value3"]
        tx_options = {"gas": 50000}

        with patch(
            "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
        ) as mock_handle_transaction:
            self.kvstore.set_bulk(keys, values, tx_options)

            mock_function.assert_called_once_with(keys, values)
            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set Bulk",
                mock_function.return_value,
                KVStoreClientError,
                tx_options,
            )

    def test_set_file_url_and_hash(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function

        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()

        with (
            patch(
                "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
            ) as mock_handle_transaction,
            patch("requests.get") as mock_get,
        ):
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url)

            mock_function.assert_called_once_with(
                ["url", "url_hash"], [url, content_hash]
            )

            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set Bulk",
                mock_function.return_value,
                KVStoreClientError,
                None,
            )

    def test_set_file_url_and_hash_with_key(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function

        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()

        with (
            patch(
                "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
            ) as mock_handle_transaction,
            patch("requests.get") as mock_get,
        ):
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url, "linkedin_url")

            mock_function.assert_called_once_with(
                ["linkedin_url", "linkedin_url_hash"], [url, content_hash]
            )

            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set Bulk",
                mock_function.return_value,
                KVStoreClientError,
                None,
            )

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
        with self.assertRaises(KVStoreClientError) as cm:
            kvstore.set_file_url_and_hash(url)
        self.assertEqual("You must add an account to Web3 instance", str(cm.exception))

    def test_set_file_url_and_hash_with_tx_options(self):
        mock_function = MagicMock()
        self.kvstore.kvstore_contract.functions.setBulk = mock_function

        url = "https://example.com"
        content = "example"
        content_hash = self.w3.keccak(text=content).hex()
        tx_options = {"gas": 50000}

        with (
            patch(
                "human_protocol_sdk.kvstore.kvstore_client.handle_transaction"
            ) as mock_handle_transaction,
            patch("requests.get") as mock_get,
        ):
            mock_response = mock_get.return_value
            mock_response.text = content

            self.kvstore.set_file_url_and_hash(url, tx_options=tx_options)

            mock_function.assert_called_once_with(
                ["url", "url_hash"], [url, content_hash]
            )

            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Set Bulk",
                mock_function.return_value,
                KVStoreClientError,
                tx_options,
            )

    def test_get(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = self.kvstore.get(address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_empty_key(self):
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = ""
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.get(address, key)
        self.assertEqual("Key can not be empty", str(cm.exception))

    def test_get_invalid_address(self):
        address = "invalid_address"
        key = "key"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.get(address, key)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_get_empty_value(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = self.kvstore.get(address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "")

    def test_get_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = kvstore.get(address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    def test_get_file_url_and_verify_hash(self):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=self.w3.keccak(text="example").hex())
                ),
            ]
        )
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = self.kvstore.get_file_url_and_verify_hash(address)

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

            self.assertEqual(result, "https://example.com")

    def test_get_file_url_and_verify_hash_with_key(self):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=self.w3.keccak(text="example").hex())
                ),
            ]
        )
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = self.kvstore.get_file_url_and_verify_hash(address, "linkedin_url")

            mock_function.assert_any_call(address, "linkedin_url")
            mock_function.assert_any_call(address, "linkedin_url_hash")

            self.assertEqual(result, "https://example.com")

    def test_get_file_url_and_verify_hash_invalid_address(self):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.get_file_url_and_verify_hash(address)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_get_file_url_and_verify_hash_empty_value(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        result = self.kvstore.get_file_url_and_verify_hash(address)

        mock_function.assert_any_call(address, "url")
        mock_function.return_value.call.assert_any_call()
        self.assertEqual(result, "")

    def test_get_file_url_and_verify_hash_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=self.w3.keccak(text="example").hex())
                ),
            ]
        )
        kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = kvstore.get_file_url_and_verify_hash(address)

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

            self.assertEqual(result, "https://example.com")

    def test_get_file_url_and_verify_hash_invalid_hash(self):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(
                        return_value=self.w3.keccak(text="invalid-hash").hex()
                    )
                ),
            ]
        )
        self.kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            with self.assertRaises(KVStoreClientError) as cm:
                self.kvstore.get_file_url_and_verify_hash(address)
            self.assertEqual("Invalid hash", str(cm.exception))

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

    def test_get_public_key(self):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(return_value=self.w3.keccak(text="PUBLIC_KEY").hex())
                ),
            ]
        )
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = self.kvstore.get_public_key(address)

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")

            self.assertEqual(result, "PUBLIC_KEY")

    def test_get_public_key_invalid_address(self):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            self.kvstore.get_public_key(address)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    def test_get_public_key_empty_value(self):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        self.kvstore.kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        result = self.kvstore.get_public_key(address)

        mock_function.assert_any_call(address, "public_key")
        mock_function.return_value.call.assert_any_call()
        self.assertEqual(result, "")

    def test_get_public_key_without_account(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        kvstore = KVStoreClient(w3)

        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(return_value=self.w3.keccak(text="PUBLIC_KEY").hex())
                ),
            ]
        )
        kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = kvstore.get_public_key(address)

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")

            self.assertEqual(result, "PUBLIC_KEY")

    def test_get_public_key_invalid_hash(self):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(
                        return_value=self.w3.keccak(text="INVALID_PUBLIC_KEY").hex()
                    )
                ),
            ]
        )
        self.kvstore.kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            with self.assertRaises(KVStoreClientError) as cm:
                self.kvstore.get_public_key(address)
            self.assertEqual("Invalid hash", str(cm.exception))

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")


if __name__ == "__main__":
    unittest.main(exit=True)
