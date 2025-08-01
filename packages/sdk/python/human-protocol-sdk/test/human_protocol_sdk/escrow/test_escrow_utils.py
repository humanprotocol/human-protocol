import unittest
from datetime import datetime
from unittest.mock import patch

from human_protocol_sdk.constants import NETWORKS, ChainId, Status, OrderDirection
from human_protocol_sdk.gql.escrow import (
    get_escrow_query,
    get_escrows_query,
)
from human_protocol_sdk.escrow import (
    EscrowClientError,
    EscrowUtils,
)
from human_protocol_sdk.filter import (
    EscrowFilter,
    FilterError,
    StatusEventFilter,
    PayoutFilter,
)


class TestEscrowUtils(unittest.TestCase):
    def test_get_escrows(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_escrow = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "intermediateResultsUrl": "https://example.com",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifestUrl": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "status": "Pending",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
            }

            def side_effect(subgraph_url, query, params):
                if subgraph_url == NETWORKS[ChainId.POLYGON_AMOY]:
                    return {"data": {"escrows": [mock_escrow]}}

            mock_function.side_effect = side_effect

            filter = EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                launcher="0x1234567890123456789012345678901234567891",
                job_requester_id="1",
                status=Status.Pending,
                date_from=datetime.fromtimestamp(1683811973),
                date_to=datetime.fromtimestamp(1683812007),
            )
            filtered = EscrowUtils.get_escrows(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_escrows_query(filter),
                params={
                    "launcher": "0x1234567890123456789012345678901234567891",
                    "reputationOracle": None,
                    "recordingOracle": None,
                    "exchangeOracle": None,
                    "jobRequesterId": "1",
                    "status": ["Pending"],
                    "from": 1683811973,
                    "to": 1683812007,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "desc",
                },
            )
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0].address, mock_escrow["address"])

            filter = EscrowFilter(chain_id=ChainId.POLYGON_AMOY)

            filtered = EscrowUtils.get_escrows(filter)

            mock_function.assert_called_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_escrows_query(filter),
                params={
                    "launcher": None,
                    "reputationOracle": None,
                    "recordingOracle": None,
                    "exchangeOracle": None,
                    "jobRequesterId": None,
                    "status": None,
                    "from": None,
                    "to": None,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "desc",
                },
            )
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_escrows_with_status_array(self):
        """Test get_escrows with an array of statuses, similar to the TypeScript test."""
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_escrow_1 = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "intermediateResultsUrl": "https://example.com",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifestUrl": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "status": "Pending",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
            }
            mock_escrow_2 = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "intermediateResultsUrl": "https://example.com",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifestUrl": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "status": "Complete",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
            }

            def side_effect(subgraph_url, query, params):
                if subgraph_url == NETWORKS[ChainId.POLYGON_AMOY]:
                    return {"data": {"escrows": [mock_escrow_1, mock_escrow_2]}}

            mock_function.side_effect = side_effect

            filter = EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                status=[Status.Pending, Status.Complete],
            )
            filtered = EscrowUtils.get_escrows(filter)

            mock_function.assert_called_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_escrows_query(filter),
                params={
                    "launcher": None,
                    "reputationOracle": None,
                    "recordingOracle": None,
                    "exchangeOracle": None,
                    "jobRequesterId": None,
                    "status": ["Pending", "Complete"],
                    "from": None,
                    "to": None,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "desc",
                },
            )
            self.assertEqual(len(filtered), 2)
            self.assertEqual(filtered[0].address, mock_escrow_1["address"])
            self.assertEqual(filtered[1].address, mock_escrow_2["address"])

    def test_get_escrow(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_escrow = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "intermediateResultsUrl": "https://example.com",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifestUrl": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "status": "Pending",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
            }

            mock_function.return_value = {
                "data": {
                    "escrow": mock_escrow,
                }
            }

            escrow = EscrowUtils.get_escrow(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_escrow_query(),
                params={
                    "escrowAddress": "0x1234567890123456789012345678901234567890",
                },
            )
            self.assertEqual(escrow.chain_id, ChainId.POLYGON_AMOY)
            self.assertEqual(escrow.address, mock_escrow["address"])
            self.assertEqual(escrow.amount_paid, int(mock_escrow["amountPaid"]))

    def test_get_escrow_empty_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {
                "data": {
                    "escrow": None,
                }
            }

            escrow = EscrowUtils.get_escrow(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )
            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_escrow_query(),
                params={
                    "escrowAddress": "0x1234567890123456789012345678901234567890",
                },
            )
            self.assertEqual(escrow, None)

    def test_get_escrow_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            EscrowUtils.get_escrow(
                ChainId(123), "0x1234567890123456789012345678901234567890"
            )
        self.assertEqual("123 is not a valid ChainId", str(cm.exception))

    def test_get_escrow_invalid_address_launcher(self):
        with self.assertRaises(EscrowClientError) as cm:
            EscrowUtils.get_escrow(ChainId.POLYGON_AMOY, "invalid_address")
        self.assertEqual("Invalid escrow address: invalid_address", str(cm.exception))

    def test_get_status_events_unsupported_chain_id(self):
        filter = StatusEventFilter(chain_id=9999)
        with self.assertRaises(EscrowClientError) as context:
            EscrowUtils.get_status_events(filter)
        self.assertEqual(str(context.exception), "Unsupported Chain ID")

    def test_get_status_events_invalid_launcher(self):
        filter = StatusEventFilter(
            chain_id=ChainId.POLYGON_AMOY, launcher="invalid_address"
        )
        with self.assertRaises(EscrowClientError) as context:
            EscrowUtils.get_status_events(filter)
        self.assertEqual(str(context.exception), "Invalid Address")

    def test_get_status_events(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "escrowStatusEvents": [
                        {
                            "timestamp": 1620000000,
                            "escrowAddress": "0x123",
                            "status": "Pending",
                        }
                    ]
                }
            }

            filter = StatusEventFilter(
                chain_id=ChainId.POLYGON_AMOY, statuses=[Status.Pending]
            )
            result = EscrowUtils.get_status_events(filter)

            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].timestamp, 1620000000)
            self.assertEqual(result[0].escrow_address, "0x123")
            self.assertEqual(result[0].status, "Pending")
            self.assertEqual(result[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_status_events_with_date_range(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "escrowStatusEvents": [
                        {
                            "timestamp": 1620000000,
                            "escrowAddress": "0x123",
                            "status": "Pending",
                        }
                    ]
                }
            }

            date_from = datetime(2021, 1, 1)
            date_to = datetime(2021, 12, 31)

            filter = StatusEventFilter(
                chain_id=ChainId.POLYGON_AMOY,
                statuses=[Status.Pending],
                date_from=date_from,
                date_to=date_to,
            )
            result = EscrowUtils.get_status_events(filter)

            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].timestamp, 1620000000)
            self.assertEqual(result[0].escrow_address, "0x123")
            self.assertEqual(result[0].status, "Pending")
            self.assertEqual(result[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_status_events_no_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {"data": {}}

            filter = StatusEventFilter(
                chain_id=ChainId.POLYGON_AMOY, statuses=[Status.Pending]
            )
            result = EscrowUtils.get_status_events(filter)

            self.assertEqual(len(result), 0)

    def test_get_status_events_with_launcher(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "escrowStatusEvents": [
                        {
                            "timestamp": 1620000000,
                            "escrowAddress": "0x123",
                            "status": "Pending",
                        }
                    ]
                }
            }

            filter = StatusEventFilter(
                chain_id=ChainId.POLYGON_AMOY,
                statuses=[Status.Pending],
                launcher="0x1234567890abcdef1234567890abcdef12345678",
            )
            result = EscrowUtils.get_status_events(filter)

            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].timestamp, 1620000000)
            self.assertEqual(result[0].escrow_address, "0x123")
            self.assertEqual(result[0].status, "Pending")
            self.assertEqual(result[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_payouts_unsupported_chain_id(self):
        filter = PayoutFilter(chain_id=9999)
        with self.assertRaises(EscrowClientError) as context:
            EscrowUtils.get_payouts(filter)
        self.assertEqual(str(context.exception), "Unsupported Chain ID")

    def test_get_payouts_invalid_escrow_address(self):
        with self.assertRaises(FilterError) as context:
            PayoutFilter(
                chain_id=ChainId.POLYGON_AMOY, escrow_address="invalid_address"
            )
        self.assertEqual(str(context.exception), "Invalid address: invalid_address")

    def test_get_payouts_invalid_recipient(self):
        with self.assertRaises(FilterError) as context:
            PayoutFilter(chain_id=ChainId.POLYGON_AMOY, recipient="invalid_address")
        self.assertEqual(str(context.exception), "Invalid address: invalid_address")

    def test_get_payouts(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "payouts": [
                        {
                            "id": "1",
                            "escrowAddress": "0x1234567890123456789012345678901234567890",
                            "recipient": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
                            "amount": "1000000000000000000",
                            "createdAt": "1672531200",
                        }
                    ]
                }
            }

            filter = PayoutFilter(chain_id=ChainId.POLYGON_AMOY)
            result = EscrowUtils.get_payouts(filter)

            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].id, "1")
            self.assertEqual(
                result[0].escrow_address, "0x1234567890123456789012345678901234567890"
            )
            self.assertEqual(
                result[0].recipient, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
            )
            self.assertEqual(result[0].amount, 1000000000000000000)
            self.assertEqual(result[0].created_at, 1672531200)

    def test_get_payouts_with_filters(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "payouts": [
                        {
                            "id": "1",
                            "escrowAddress": "0x1234567890123456789012345678901234567891",
                            "recipient": "0x1234567890123456789012345678901234567892",
                            "amount": "1000000000000000000",
                            "createdAt": "1672531200",
                        }
                    ]
                }
            }

            filter = PayoutFilter(
                chain_id=ChainId.POLYGON_AMOY,
                escrow_address="0x1234567890123456789012345678901234567891",
                recipient="0x1234567890123456789012345678901234567892",
                date_from=datetime(2023, 1, 1),
                date_to=datetime(2023, 12, 31),
            )
            result = EscrowUtils.get_payouts(filter)

            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].id, "1")
            self.assertEqual(
                result[0].escrow_address, "0x1234567890123456789012345678901234567891"
            )
            self.assertEqual(
                result[0].recipient, "0x1234567890123456789012345678901234567892"
            )
            self.assertEqual(result[0].amount, 1000000000000000000)
            self.assertEqual(result[0].created_at, 1672531200)

    def test_get_payouts_no_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {"data": {"payouts": []}}

            filter = PayoutFilter(chain_id=ChainId.POLYGON_AMOY)
            result = EscrowUtils.get_payouts(filter)

            self.assertEqual(len(result), 0)

    def test_get_payouts_with_pagination(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.get_data_from_subgraph"
        ) as mock_get_data_from_subgraph:
            mock_get_data_from_subgraph.return_value = {
                "data": {
                    "payouts": [
                        {
                            "id": "1",
                            "escrowAddress": "0x1234567890123456789012345678901234567890",
                            "recipient": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
                            "amount": "1000000000000000000",
                            "createdAt": "1672531200",
                        },
                        {
                            "id": "2",
                            "escrowAddress": "0x1234567890123456789012345678901234567890",
                            "recipient": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
                            "amount": "2000000000000000000",
                            "createdAt": "1672617600",
                        },
                    ]
                }
            }

            filter = PayoutFilter(chain_id=ChainId.POLYGON_AMOY, first=20, skip=10)
            result = EscrowUtils.get_payouts(filter)

            self.assertEqual(len(result), 2)
            self.assertEqual(result[0].id, "1")
            self.assertEqual(result[1].id, "2")
            self.assertEqual(result[0].amount, 1000000000000000000)
            self.assertEqual(result[1].amount, 2000000000000000000)


if __name__ == "__main__":
    unittest.main(exit=True)
