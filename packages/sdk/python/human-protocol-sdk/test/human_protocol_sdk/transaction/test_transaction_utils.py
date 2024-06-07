import unittest
from datetime import datetime
from unittest.mock import ANY, patch

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.gql.transaction import (
    get_transaction_query,
    get_transactions_query,
)
from human_protocol_sdk.transaction import (
    TransactionUtils,
)
from human_protocol_sdk.filter import TransactionFilter


class TestTransactionUtils(unittest.TestCase):
    def test_get_transactions(self):
        with patch(
            "human_protocol_sdk.transaction.transaction_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_transaction_1 = {
                "block": 123,
                "txHash": "0x1234567890123456789012345678901234567890123456789012345678901234",
                "from": "0x1234567890123456789012345678901234567890",
                "to": "0x9876543210987654321098765432109876543210",
                "timestamp": 1622700000,
                "value": "1000000000000000000",
                "method": "transfer",
            }
            mock_transaction_2 = {
                "block": 456,
                "txHash": "0x9876543210987654321098765432109876543210987654321098765432109876",
                "from": "0x9876543210987654321098765432109876543210",
                "to": "0x1234567890123456789012345678901234567890",
                "timestamp": 1622800000,
                "value": "2000000000000000000",
                "method": "transfer",
            }

            mock_function.return_value = {
                "data": {"transactions": [mock_transaction_1, mock_transaction_2]}
            }

            filter = TransactionFilter(
                networks=[ChainId.POLYGON_AMOY],
                from_address="0x1234567890123456789012345678901234567890",
                to_address="0x9876543210987654321098765432109876543210",
            )

            transactions = TransactionUtils.get_transactions(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_transactions_query(filter),
                params={
                    "fromAddress": "0x1234567890123456789012345678901234567890",
                    "toAddress": "0x9876543210987654321098765432109876543210",
                    "startDate": None,
                    "endDate": None,
                    "startBlock": None,
                    "endBlock": None,
                },
            )
            self.assertEqual(len(transactions), 2)
            self.assertEqual(transactions[0].chain_id, ChainId.POLYGON_AMOY)
            self.assertEqual(transactions[1].chain_id, ChainId.POLYGON_AMOY)

    def test_get_transactions_empty_response(self):
        with patch(
            "human_protocol_sdk.transaction.transaction_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {"data": {"transactions": []}}

            filter = TransactionFilter(
                networks=[ChainId.POLYGON_AMOY],
                from_address="0x1234567890123456789012345678901234567890",
            )

            transactions = TransactionUtils.get_transactions(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_transactions_query(filter),
                params={
                    "fromAddress": "0x1234567890123456789012345678901234567890",
                    "toAddress": None,
                    "startDate": None,
                    "endDate": None,
                    "startBlock": None,
                    "endBlock": None,
                },
            )
            self.assertEqual(len(transactions), 0)

    def test_get_transactions_invalid_network(self):
        with self.assertRaises(ValueError) as cm:
            filter = TransactionFilter(networks=[ChainId(12345)])
            TransactionUtils.get_transactions(filter)
        self.assertEqual("12345 is not a valid ChainId", str(cm.exception))

    def test_get_transactions_invalid_from_address(self):
        with self.assertRaises(ValueError) as cm:
            TransactionUtils.get_transactions(
                TransactionFilter(
                    networks=[ChainId.POLYGON_AMOY],
                    from_address="invalid_address",
                )
            )
        self.assertEqual("Invalid from_address: invalid_address", str(cm.exception))

    def test_get_transactions_invalid_to_address(self):
        with self.assertRaises(ValueError) as cm:
            TransactionUtils.get_transactions(
                TransactionFilter(
                    networks=[ChainId.POLYGON_AMOY],
                    to_address="invalid_address",
                )
            )
        self.assertEqual("Invalid to_address: invalid_address", str(cm.exception))

    def test_get_transaction(self):
        with patch(
            "human_protocol_sdk.transaction.transaction_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_transaction = {
                "block": 123,
                "txHash": "0x1234567890123456789012345678901234567890123456789012345678901234",
                "from": "0x1234567890123456789012345678901234567890",
                "to": "0x9876543210987654321098765432109876543210",
                "timestamp": 1622700000,
                "value": "1000000000000000000",
                "method": "transfer",
            }

            mock_function.return_value = {"data": {"transaction": mock_transaction}}

            transaction = TransactionUtils.get_transaction(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890123456789012345678901234",
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_transaction_query(),
                params={
                    "hash": "0x1234567890123456789012345678901234567890123456789012345678901234"
                },
            )
            self.assertIsNotNone(transaction)
            self.assertEqual(transaction.chain_id, ChainId.POLYGON_AMOY)
            self.assertEqual(transaction.block, mock_transaction["block"])
            self.assertEqual(transaction.hash, mock_transaction["txHash"])
            self.assertEqual(transaction.from_address, mock_transaction["from"])
            self.assertEqual(transaction.to_address, mock_transaction["to"])
            self.assertEqual(transaction.timestamp, mock_transaction["timestamp"])
            self.assertEqual(transaction.value, mock_transaction["value"])
            self.assertEqual(transaction.method, mock_transaction["method"])

    def test_get_transaction_empty_data(self):
        with patch(
            "human_protocol_sdk.transaction.transaction_utils.get_data_from_subgraph"
        ) as mock_function:

            mock_function.return_value = {"data": {"transaction": None}}

            transaction = TransactionUtils.get_transaction(
                ChainId.POLYGON_AMOY, "transaction_hash"
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=ANY,
                params={"hash": "transaction_hash"},
            )

            self.assertIsNone(transaction)

    def test_get_transaction_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            TransactionUtils.get_transaction(
                ChainId(123), "0x1234567890123456789012345678901234567891"
            )
        self.assertEqual("123 is not a valid ChainId", str(cm.exception))


if __name__ == "__main__":
    unittest.main(exit=True)
