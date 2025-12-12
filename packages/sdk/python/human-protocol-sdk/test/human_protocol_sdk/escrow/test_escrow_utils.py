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
    CancellationRefundFilter,
    EscrowFilter,
    FilterError,
    StatusEventFilter,
    PayoutFilter,
)


class TestEscrowUtils(unittest.TestCase):
    def test_get_escrows(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_escrow = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "finalResultsHash": "0x1234567890123456789012345678901234567891",
                "intermediateResultsUrl": "https://example.com",
                "intermediateResultsHash": "0x1234567890123456789012345678901234567891",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifest": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "recordingOracleFee": "1000000000000000000",
                "reputationOracleFee": "1000000000000000000",
                "exchangeOracleFee": "1000000000000000000",
                "status": "Pending",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
                "createdAt": "1683811973",
            }

            def side_effect(subgraph_url, query, params, options):
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
                options=None,
            )
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0].address, mock_escrow["address"])
            self.assertEqual(filtered[0].id, mock_escrow["id"])
            self.assertEqual(filtered[0].amount_paid, int(mock_escrow["amountPaid"]))
            self.assertEqual(filtered[0].balance, int(mock_escrow["balance"]))
            self.assertEqual(filtered[0].count, int(mock_escrow["count"]))
            self.assertEqual(filtered[0].factory_address, mock_escrow["factoryAddress"])
            self.assertEqual(
                filtered[0].final_results_url, mock_escrow["finalResultsUrl"]
            )
            self.assertEqual(
                filtered[0].final_results_hash, mock_escrow["finalResultsHash"]
            )
            self.assertEqual(
                filtered[0].intermediate_results_url,
                mock_escrow["intermediateResultsUrl"],
            )
            self.assertEqual(
                filtered[0].intermediate_results_hash,
                mock_escrow["intermediateResultsHash"],
            )
            self.assertEqual(filtered[0].launcher, mock_escrow["launcher"])
            self.assertEqual(filtered[0].manifest_hash, mock_escrow["manifestHash"])
            self.assertEqual(filtered[0].manifest, mock_escrow["manifest"])
            self.assertEqual(
                filtered[0].recording_oracle, mock_escrow["recordingOracle"]
            )
            self.assertEqual(
                filtered[0].reputation_oracle, mock_escrow["reputationOracle"]
            )
            self.assertEqual(filtered[0].exchange_oracle, mock_escrow["exchangeOracle"])
            self.assertEqual(
                filtered[0].recording_oracle_fee, int(mock_escrow["recordingOracleFee"])
            )
            self.assertEqual(
                filtered[0].reputation_oracle_fee,
                int(mock_escrow["reputationOracleFee"]),
            )
            self.assertEqual(
                filtered[0].exchange_oracle_fee, int(mock_escrow["exchangeOracleFee"])
            )
            self.assertEqual(filtered[0].status, mock_escrow["status"])
            self.assertEqual(filtered[0].token, mock_escrow["token"])
            self.assertEqual(
                filtered[0].total_funded_amount, int(mock_escrow["totalFundedAmount"])
            )
            self.assertEqual(
                int(filtered[0].created_at), int(mock_escrow["createdAt"]) * 1000
            )

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
                options=None,
            )
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_escrows_with_status_array(self):
        """Test get_escrows with an array of statuses, similar to the TypeScript test."""
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
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
                "createdAt": "1672531200000",
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
                "createdAt": "1672531200000",
            }

            def side_effect(subgraph_url, query, params, options):
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
                options=None,
            )
            self.assertEqual(len(filtered), 2)
            self.assertEqual(filtered[0].address, mock_escrow_1["address"])
            self.assertEqual(filtered[1].address, mock_escrow_2["address"])

    def test_get_escrow(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_escrow = {
                "id": "0x1234567890123456789012345678901234567891",
                "address": "0x1234567890123456789012345678901234567891",
                "amountPaid": "1000000000000000000",
                "balance": "1000000000000000000",
                "count": "1",
                "factoryAddress": "0x1234567890123456789012345678901234567890",
                "finalResultsUrl": "https://example.com",
                "finalResultsHash": "0x1234567890123456789012345678901234567891",
                "intermediateResultsUrl": "https://example.com",
                "intermediateResultsHash": "0x1234567890123456789012345678901234567891",
                "launcher": "0x1234567890123456789012345678901234567891",
                "manifestHash": "0x1234567890123456789012345678901234567891",
                "manifest": "https://example.com",
                "recordingOracle": "0x1234567890123456789012345678901234567891",
                "reputationOracle": "0x1234567890123456789012345678901234567891",
                "exchangeOracle": "0x1234567890123456789012345678901234567891",
                "recordingOracleFee": "1000000000000000000",
                "reputationOracleFee": "1000000000000000000",
                "exchangeOracleFee": "1000000000000000000",
                "status": "Pending",
                "token": "0x1234567890123456789012345678901234567891",
                "totalFundedAmount": "1000000000000000000",
                "createdAt": "1683813973",
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
                options=None,
            )
            self.assertEqual(escrow.chain_id, ChainId.POLYGON_AMOY)
            self.assertEqual(escrow.address, mock_escrow["address"])
            self.assertEqual(escrow.amount_paid, int(mock_escrow["amountPaid"]))
            self.assertEqual(escrow.balance, int(mock_escrow["balance"]))
            self.assertEqual(escrow.count, int(mock_escrow["count"]))
            self.assertEqual(escrow.factory_address, mock_escrow["factoryAddress"])
            self.assertEqual(escrow.final_results_url, mock_escrow["finalResultsUrl"])
            self.assertEqual(escrow.final_results_hash, mock_escrow["finalResultsHash"])
            self.assertEqual(
                escrow.intermediate_results_url, mock_escrow["intermediateResultsUrl"]
            )
            self.assertEqual(
                escrow.intermediate_results_hash, mock_escrow["intermediateResultsHash"]
            )
            self.assertEqual(escrow.launcher, mock_escrow["launcher"])
            self.assertEqual(escrow.manifest_hash, mock_escrow["manifestHash"])
            self.assertEqual(escrow.manifest, mock_escrow["manifest"])
            self.assertEqual(escrow.recording_oracle, mock_escrow["recordingOracle"])
            self.assertEqual(escrow.reputation_oracle, mock_escrow["reputationOracle"])
            self.assertEqual(escrow.exchange_oracle, mock_escrow["exchangeOracle"])
            self.assertEqual(
                escrow.recording_oracle_fee, int(mock_escrow["recordingOracleFee"])
            )
            self.assertEqual(
                escrow.reputation_oracle_fee, int(mock_escrow["reputationOracleFee"])
            )
            self.assertEqual(
                escrow.exchange_oracle_fee, int(mock_escrow["exchangeOracleFee"])
            )
            self.assertEqual(escrow.status, mock_escrow["status"])
            self.assertEqual(escrow.token, mock_escrow["token"])
            self.assertEqual(
                escrow.total_funded_amount, int(mock_escrow["totalFundedAmount"])
            )
            self.assertEqual(
                int(escrow.created_at), int(mock_escrow["createdAt"]) * 1000
            )

    def test_get_escrow_empty_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
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
                options=None,
            )
            self.assertEqual(escrow, None)

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
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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
            self.assertEqual(result[0].timestamp, 1620000000000)
            self.assertEqual(result[0].escrow_address, "0x123")
            self.assertEqual(result[0].status, "Pending")
            self.assertEqual(result[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_status_events_with_date_range(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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
            self.assertEqual(result[0].timestamp, 1620000000000)
            self.assertEqual(result[0].escrow_address, "0x123")
            self.assertEqual(result[0].status, "Pending")
            self.assertEqual(result[0].chain_id, ChainId.POLYGON_AMOY)

    def test_get_status_events_no_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {"data": {}}

            filter = StatusEventFilter(
                chain_id=ChainId.POLYGON_AMOY, statuses=[Status.Pending]
            )
            result = EscrowUtils.get_status_events(filter)

            self.assertEqual(len(result), 0)

    def test_get_status_events_with_launcher(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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
            self.assertEqual(result[0].timestamp, 1620000000000)
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
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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
            self.assertEqual(result[0].created_at, 1672531200000)

    def test_get_payouts_with_filters(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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
            self.assertEqual(result[0].created_at, 1672531200000)

    def test_get_payouts_no_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {"data": {"payouts": []}}

            filter = PayoutFilter(chain_id=ChainId.POLYGON_AMOY)
            result = EscrowUtils.get_payouts(filter)

            self.assertEqual(len(result), 0)

    def test_get_payouts_with_pagination(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_custom_gql_fetch:
            mock_custom_gql_fetch.return_value = {
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

    def test_get_cancellation_refunds(self):
        from human_protocol_sdk.escrow.escrow_utils import CancellationRefundFilter

        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_refund = {
                "id": "1",
                "escrowAddress": "0x1234567890123456789012345678901234567890",
                "receiver": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
                "amount": "1000000000000000000",
                "block": "123456",
                "timestamp": "1672531200",
                "txHash": "0xhash1",
            }

            def side_effect(subgraph_url, query, params, options):
                if subgraph_url == NETWORKS[ChainId.POLYGON_AMOY]:
                    return {"data": {"cancellationRefundEvents": [mock_refund]}}

            mock_function.side_effect = side_effect

            filter = CancellationRefundFilter(
                chain_id=ChainId.POLYGON_AMOY,
                escrow_address="0x1234567890123456789012345678901234567890",
                date_from=datetime.fromtimestamp(1672531200),
                date_to=datetime.fromtimestamp(1672531300),
                first=10,
                skip=0,
                order_direction=OrderDirection.DESC,
            )
            refunds = EscrowUtils.get_cancellation_refunds(filter)

            mock_function.assert_called_once()
            self.assertEqual(len(refunds), 1)
            self.assertEqual(refunds[0].id, mock_refund["id"])
            self.assertEqual(refunds[0].escrow_address, mock_refund["escrowAddress"])
            self.assertEqual(refunds[0].receiver, mock_refund["receiver"])
            self.assertEqual(refunds[0].amount, int(mock_refund["amount"]))
            self.assertEqual(refunds[0].block, int(mock_refund["block"]))
            self.assertEqual(refunds[0].timestamp, int(mock_refund["timestamp"]) * 1000)
            self.assertEqual(refunds[0].tx_hash, mock_refund["txHash"])

    def test_get_cancellation_refunds_invalid_escrow_address(self):
        with self.assertRaises(FilterError) as context:
            CancellationRefundFilter(
                chain_id=ChainId.POLYGON_AMOY, escrow_address="invalid_address"
            )
        self.assertEqual(
            str(context.exception), "Invalid escrow address: invalid_address"
        )

    def test_get_cancellation_refunds_invalid_receiver(self):
        with self.assertRaises(FilterError) as context:
            CancellationRefundFilter(
                chain_id=ChainId.POLYGON_AMOY, receiver="invalid_address"
            )
        self.assertEqual(
            str(context.exception), "Invalid receiver address: invalid_address"
        )

    def test_get_cancellation_refunds_invalid_dates(self):
        with self.assertRaises(FilterError) as context:
            CancellationRefundFilter(
                chain_id=ChainId.POLYGON_AMOY,
                date_from=datetime(2023, 6, 8),
                date_to=datetime(2023, 5, 8),
            )
        self.assertTrue("must be earlier than" in str(context.exception))

    def test_get_cancellation_refunds_no_data(self):
        from human_protocol_sdk.escrow.escrow_utils import CancellationRefundFilter

        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_function.return_value = {"data": {"cancellationRefundEvents": []}}

            filter = CancellationRefundFilter(chain_id=ChainId.POLYGON_AMOY)
            refunds = EscrowUtils.get_cancellation_refunds(filter)

            self.assertEqual(len(refunds), 0)

    def test_get_cancellation_refund(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_refund = {
                "id": "1",
                "escrowAddress": "0x1234567890123456789012345678901234567890",
                "receiver": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
                "amount": "1000000000000000000",
                "block": "123456",
                "timestamp": "1672531200",
                "txHash": "0xhash1",
            }

            mock_function.return_value = {
                "data": {
                    "cancellationRefundEvents": [mock_refund],
                }
            }

            refund = EscrowUtils.get_cancellation_refund(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )

            mock_function.assert_called_once()
            self.assertIsNotNone(refund)
            self.assertEqual(refund.id, mock_refund["id"])
            self.assertEqual(refund.escrow_address, mock_refund["escrowAddress"])
            self.assertEqual(refund.receiver, mock_refund["receiver"])
            self.assertEqual(refund.amount, int(mock_refund["amount"]))
            self.assertEqual(refund.block, int(mock_refund["block"]))
            self.assertEqual(refund.timestamp, int(mock_refund["timestamp"]) * 1000)
            self.assertEqual(refund.tx_hash, mock_refund["txHash"])

    def test_get_cancellation_refund_no_data(self):
        with patch(
            "human_protocol_sdk.escrow.escrow_utils.custom_gql_fetch"
        ) as mock_function:
            mock_function.return_value = {"data": {"cancellationRefundEvents": []}}

            refund = EscrowUtils.get_cancellation_refund(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )
            self.assertIsNone(refund)

    def test_get_cancellation_refund_invalid_address(self):
        with self.assertRaises(EscrowClientError) as cm:
            EscrowUtils.get_cancellation_refund(ChainId.POLYGON_AMOY, "invalid_address")
        self.assertEqual("Invalid escrow address", str(cm.exception))


if __name__ == "__main__":
    unittest.main(exit=True)
