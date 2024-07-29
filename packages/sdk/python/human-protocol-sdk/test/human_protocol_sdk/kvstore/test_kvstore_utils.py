import unittest
from unittest.mock import MagicMock, PropertyMock, patch
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.kvstore import KVStoreUtils, KVStoreClientError
from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_query
from web3 import Web3
from web3.providers.rpc import HTTPProvider


class TestKVStoreUtils(unittest.TestCase):
    def test_get_kvstore_data(self):
        with patch(
            "human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_kvstore_data = [
                {
                    "id": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65-fee",
                    "block": "31",
                    "timestamp": "1717510736",
                    "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
                    "key": "fee",
                    "value": "1",
                },
                {
                    "id": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65-jwt_public_key",
                    "block": "33",
                    "timestamp": "1717510740",
                    "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
                    "key": "jwt_public_key",
                    "value": "http://localhost:9000/bucket/public-key.txt",
                },
            ]

            mock_function.return_value = {
                "data": {
                    "kvstores": mock_kvstore_data,
                }
            }

            kvstores = KVStoreUtils.get_kvstore_data(
                ChainId.POLYGON_AMOY,
                "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_kvstore_by_address_query(),
                params={
                    "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
                },
            )
            self.assertEqual(len(kvstores), 2)
            self.assertEqual(kvstores[0].key, "fee")
            self.assertEqual(kvstores[0].value, "1")

    def test_get_kvstore_data_empty_data(self):
        with patch(
            "human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {
                "data": {
                    "kvstores": [],
                }
            }

            kvstores = KVStoreUtils.get_kvstore_data(
                ChainId.POLYGON_AMOY,
                "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
            )
            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_kvstore_by_address_query(),
                params={
                    "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
                },
            )
            self.assertEqual(kvstores, [])

    def test_get_kvstore_data_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            KVStoreUtils.get_kvstore_data(
                ChainId(123), "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
            )
        self.assertEqual("123 is not a valid ChainId", str(cm.exception))

    def test_get_kvstore_data_invalid_address(self):
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_kvstore_data(ChainId.LOCALHOST, "invalid_address")
        self.assertEqual("Invalid KVStore address: invalid_address", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get(self, mock_kvstore_contract):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = KVStoreUtils.get(mock_kvstore_contract, address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_empty_key(self, mock_kvstore_contract):
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = ""
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get(mock_kvstore_contract, address, key)
        self.assertEqual("Key can not be empty", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_invalid_address(self, mock_kvstore_contract):
        address = "invalid_address"
        key = "key"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get(mock_kvstore_contract, address, key)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_empty_value(self, mock_kvstore_contract):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = KVStoreUtils.get(mock_kvstore_contract, address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_without_account(self, mock_kvstore_contract):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        mock_function = MagicMock()
        mock_function.return_value.call.return_value = "mock_value"
        mock_kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = KVStoreUtils.get(mock_kvstore_contract, address, key)

        mock_function.assert_called_once_with(address, key)
        mock_function.return_value.call.assert_called_once_with()
        self.assertEqual(result, "mock_value")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash(self, mock_kvstore_contract):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="example").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                mock_kvstore_contract, address
            )

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash_with_key(self, mock_kvstore_contract):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="example").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                mock_kvstore_contract, address, "linkedin_url"
            )

            mock_function.assert_any_call(address, "linkedin_url")
            mock_function.assert_any_call(address, "linkedin_url_hash")

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash_invalid_address(self, mock_kvstore_contract):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_file_url_and_verify_hash(mock_kvstore_contract, address)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash_empty_value(self, mock_kvstore_contract):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        result = KVStoreUtils.get_file_url_and_verify_hash(
            mock_kvstore_contract, address
        )

        mock_function.assert_any_call(address, "url")
        mock_function.return_value.call.assert_any_call()
        self.assertEqual(result, "")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash_without_account(self, mock_kvstore_contract):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="example").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                mock_kvstore_contract, address
            )

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_file_url_and_verify_hash_invalid_hash(self, mock_kvstore_contract):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="https://example.com")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="invalid-hash").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            with self.assertRaises(KVStoreClientError) as cm:
                KVStoreUtils.get_file_url_and_verify_hash(
                    mock_kvstore_contract, address
                )
            self.assertEqual("Invalid hash", str(cm.exception))

            mock_function.assert_any_call(address, "url")
            mock_function.assert_any_call(address, "url_hash")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_public_key(self, mock_kvstore_contract):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="PUBLIC_KEY").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = KVStoreUtils.get_public_key(mock_kvstore_contract, address)

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")

            self.assertEqual(result, "PUBLIC_KEY")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_public_key_invalid_address(self, mock_kvstore_contract):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_public_key(mock_kvstore_contract, address)
        self.assertEqual("Invalid address: invalid_address", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_public_key_empty_value(self, mock_kvstore_contract):
        mock_function = MagicMock()
        mock_function.return_value.call.return_value = ""
        mock_kvstore_contract.functions.get = mock_function
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        result = KVStoreUtils.get_public_key(mock_kvstore_contract, address)

        mock_function.assert_any_call(address, "public_key")
        mock_function.return_value.call.assert_any_call()
        self.assertEqual(result, "")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_public_key_without_account(self, mock_kvstore_contract):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)
        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(return_value=Web3.keccak(text="PUBLIC_KEY").hex())
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = KVStoreUtils.get_public_key(mock_kvstore_contract, address)

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")

            self.assertEqual(result, "PUBLIC_KEY")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.kvstore_contract", create=True)
    def test_get_public_key_invalid_hash(self, mock_kvstore_contract):
        mock_function = MagicMock(
            side_effect=[
                MagicMock(call=MagicMock(return_value="PUBLIC_KEY_URL")),
                MagicMock(
                    call=MagicMock(
                        return_value=Web3.keccak(text="INVALID_PUBLIC_KEY").hex()
                    )
                ),
            ]
        )
        mock_kvstore_contract.functions.get = mock_function

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            with self.assertRaises(KVStoreClientError) as cm:
                KVStoreUtils.get_public_key(mock_kvstore_contract, address)
            self.assertEqual("Invalid hash", str(cm.exception))

            mock_function.assert_any_call(address, "public_key")
            mock_function.assert_any_call(address, "public_key_hash")


if __name__ == "__main__":
    unittest.main(exit=True)
