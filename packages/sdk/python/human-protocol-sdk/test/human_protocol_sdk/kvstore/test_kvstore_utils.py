import unittest
from unittest.mock import patch
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.kvstore import KVStoreUtils, KVStoreClientError
from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_query


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


if __name__ == "__main__":
    unittest.main(exit=True)
