import unittest
from unittest.mock import MagicMock, PropertyMock, patch
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.kvstore import KVStoreUtils, KVStoreClientError
from human_protocol_sdk.gql.kvstore import (
    get_kvstore_by_address_query,
    get_kvstore_by_address_and_key_query,
)
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

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get(self, mock_function):
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key1"
        mock_kvstore_data = [
            {
                "id": f"{address}-fee",
                "block": "31",
                "timestamp": "1717510736",
                "address": address,
                "key": key,
                "value": "1",
            },
        ]

        mock_function.return_value = {
            "data": {
                "kvstores": mock_kvstore_data,
            }
        }

        result = KVStoreUtils.get(ChainId.LOCALHOST, address, key)

        mock_function.assert_called_once_with(
            NETWORKS[ChainId.LOCALHOST],
            query=get_kvstore_by_address_and_key_query(),
            params={"address": address, "key": key},
        )
        self.assertEqual(result, "1")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_empty_key(self, mock_function):
        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = ""
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get(ChainId.LOCALHOST, address, key)
        self.assertEqual("Key can not be empty", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_invalid_address(self, mock_function):
        address = "invalid_address"
        key = "key"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get(ChainId.LOCALHOST, address, key)
        self.assertEqual(f"Invalid address: {address}", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_empty_value(self, mock_function):
        mock_function.return_value = {"data": {"kvstores": []}}

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get(ChainId.LOCALHOST, address, key)
        self.assertEqual(
            f"Key '{key}' not found for address {address}", str(cm.exception)
        )

        mock_function.assert_called_once_with(
            NETWORKS[ChainId.LOCALHOST],
            query=get_kvstore_by_address_and_key_query(),
            params={"address": address, "key": key},
        )

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_without_account(self, mock_function):
        mock_function.return_value = {
            "data": {
                "kvstores": [
                    {
                        "id": "0x1234567890123456789012345678901234567890-fee",
                        "block": "31",
                        "timestamp": "1717510736",
                        "address": "0x1234567890123456789012345678901234567890",
                        "key": "key",
                        "value": "mock_value",
                    }
                ]
            }
        }

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "key"

        result = KVStoreUtils.get(ChainId.LOCALHOST, address, key)

        mock_function.assert_called_once_with(
            NETWORKS[ChainId.LOCALHOST],
            query=get_kvstore_by_address_and_key_query(),
            params={"address": address, "key": key},
        )
        self.assertEqual(result, "mock_value")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "https://example.com"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="example").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                ChainId.LOCALHOST, address
            )

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash_with_key(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "https://example.com"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="example").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                ChainId.LOCALHOST, address, "linkedin_url"
            )

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash_invalid_address(self, mock_function):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_file_url_and_verify_hash(ChainId.LOCALHOST, address)
        self.assertEqual(f"Invalid address: {address}", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash_empty_value(self, mock_function):
        mock_function.return_value = {"data": {"kvstores": []}}

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
        key = "url"

        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_file_url_and_verify_hash(ChainId.LOCALHOST, address)
        self.assertEqual(
            f"Key '{key}' not found for address {address}", str(cm.exception)
        )

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash_without_account(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "https://example.com"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="example").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            result = KVStoreUtils.get_file_url_and_verify_hash(
                ChainId.LOCALHOST, address
            )

            self.assertEqual(result, "https://example.com")

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_file_url_and_verify_hash_invalid_hash(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "https://example.com"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="invalid-hash").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "example"

            with self.assertRaises(KVStoreClientError) as cm:
                KVStoreUtils.get_file_url_and_verify_hash(ChainId.LOCALHOST, address)
            self.assertEqual("Invalid hash", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_public_key(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "PUBLIC_KEY_URL"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="PUBLIC_KEY").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = KVStoreUtils.get_public_key(ChainId.LOCALHOST, address)

            self.assertEqual(result, "PUBLIC_KEY")

    def test_get_public_key_invalid_address(self):
        address = "invalid_address"
        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_public_key(ChainId.LOCALHOST, address)
        self.assertEqual(f"Invalid address: {address}", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_public_key_empty_value(self, mock_function):
        mock_function.return_value = {"data": {"kvstores": []}}

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        key = "public_key"

        with self.assertRaises(KVStoreClientError) as cm:
            KVStoreUtils.get_public_key(ChainId.LOCALHOST, address)
        self.assertEqual(
            f"Key '{key}' not found for address {address}", str(cm.exception)
        )

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_public_key_invalid_hash(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "PUBLIC_KEY_URL"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="invalid-hash").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            with self.assertRaises(KVStoreClientError) as cm:
                KVStoreUtils.get_public_key(ChainId.LOCALHOST, address)
            self.assertEqual("Invalid hash", str(cm.exception))

    @patch("human_protocol_sdk.kvstore.kvstore_utils.get_data_from_subgraph")
    def test_get_public_key_without_account(self, mock_function):
        mock_function.side_effect = [
            {"data": {"kvstores": [{"value": "PUBLIC_KEY_URL"}]}},
            {"data": {"kvstores": [{"value": Web3.keccak(text="PUBLIC_KEY").hex()}]}},
        ]

        address = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")

        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.text = "PUBLIC_KEY"

            result = KVStoreUtils.get_public_key(ChainId.LOCALHOST, address)

            self.assertEqual(result, "PUBLIC_KEY")


if __name__ == "__main__":
    unittest.main(exit=True)
