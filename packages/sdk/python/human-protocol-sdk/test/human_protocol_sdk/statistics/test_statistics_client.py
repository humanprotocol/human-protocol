import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.gql.hmtoken import get_holders_query
from human_protocol_sdk.gql.statistics import (
    get_event_day_data_query,
    get_escrow_statistics_query,
    get_hmtoken_statistics_query,
)
from human_protocol_sdk.statistics import (
    StatisticsClient,
    StatisticsFilter,
    HMTHoldersParam,
)


class TestStatisticsClient(unittest.TestCase):
    def setUp(self):
        self.statistics = StatisticsClient(ChainId.LOCALHOST)

    def test_init_with_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            StatisticsClient(ChainId(123))
        self.assertEqual(f"123 is not a valid ChainId", str(cm.exception))

    def test_get_escrow_statistics(self):
        param = StatisticsFilter(
            date_from=datetime.fromtimestamp(1683811973),
            date_to=datetime.fromtimestamp(1683812007),
        )
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "escrowStatistics": {
                            "totalEscrowCount": "1",
                        },
                    }
                },
                {
                    "data": {
                        "eventDayDatas": [
                            {
                                "timestamp": 1,
                                "dailyEscrowCount": "1",
                                "dailyPendingStatusEventCount": "1",
                                "dailyCancelledStatusEventCount": "1",
                                "dailyPartialStatusEventCount": "1",
                                "dailyPaidStatusEventCount": "1",
                                "dailyCompletedStatusEventCount": "1",
                            },
                        ],
                    }
                },
            ]

            escrow_statistics = self.statistics.get_escrow_statistics(param)

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_escrow_statistics_query,
            )

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "asc",
                },
            )

            self.assertEqual(escrow_statistics.total_escrows, 1)
            self.assertEqual(len(escrow_statistics.daily_escrows_data), 1)
            self.assertEqual(
                escrow_statistics.daily_escrows_data[0].timestamp,
                datetime.fromtimestamp(1),
            )
            self.assertEqual(escrow_statistics.daily_escrows_data[0].escrows_total, 1)
            self.assertEqual(escrow_statistics.daily_escrows_data[0].escrows_pending, 1)
            self.assertEqual(escrow_statistics.daily_escrows_data[0].escrows_solved, 1)
            self.assertEqual(escrow_statistics.daily_escrows_data[0].escrows_paid, 1)
            self.assertEqual(
                escrow_statistics.daily_escrows_data[0].escrows_cancelled, 1
            )

    def test_get_worker_statistics(self):
        param = StatisticsFilter(
            date_from=datetime.fromtimestamp(1683811973),
            date_to=datetime.fromtimestamp(1683812007),
        )
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "eventDayDatas": [
                            {
                                "timestamp": 1,
                                "dailyWorkerCount": "4",
                            },
                        ],
                    }
                },
            ]

            payment_statistics = self.statistics.get_worker_statistics(param)

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "asc",
                },
            )

            self.assertEqual(len(payment_statistics.daily_workers_data), 1)
            self.assertEqual(
                payment_statistics.daily_workers_data[0].timestamp,
                datetime.fromtimestamp(1),
            )

    def test_get_payment_statistics(self):
        param = StatisticsFilter(
            date_from=datetime.fromtimestamp(1683811973),
            date_to=datetime.fromtimestamp(1683812007),
        )
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "eventDayDatas": [
                            {
                                "timestamp": 1,
                                "dailyPayoutCount": "4",
                                "dailyPayoutAmount": "100",
                                "dailyWorkerCount": "4",
                            },
                        ],
                    }
                },
            ]

            payment_statistics = self.statistics.get_payment_statistics(param)

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "asc",
                },
            )

            self.assertEqual(len(payment_statistics.daily_payments_data), 1)
            self.assertEqual(
                payment_statistics.daily_payments_data[0].timestamp,
                datetime.fromtimestamp(1),
            )
            self.assertEqual(
                payment_statistics.daily_payments_data[0].total_amount_paid, 100
            )
            self.assertEqual(payment_statistics.daily_payments_data[0].total_count, 4)
            self.assertEqual(
                payment_statistics.daily_payments_data[0].average_amount_per_worker, 25
            )

    def test_get_hmt_statistics(self):
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "hmtokenStatistics": {
                            "totalValueTransfered": "100",
                            "totalTransferEventCount": "4",
                            "holders": "2",
                        },
                    }
                },
            ]

            hmt_statistics = self.statistics.get_hmt_statistics()

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_hmtoken_statistics_query,
            )

            self.assertEqual(hmt_statistics.total_transfer_amount, 100)
            self.assertEqual(hmt_statistics.total_transfer_count, 4)
            self.assertEqual(hmt_statistics.total_holders, 2)

    def test_get_hmt_holders(self):
        param = HMTHoldersParam(
            order_direction="asc",
        )

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "holders": [
                            {"address": "0x123", "balance": "1000"},
                            {"address": "0x456", "balance": "2000"},
                        ]
                    }
                }
            ]

            holders = self.statistics.get_hmt_holders(param)

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_holders_query(
                    address=param.address,
                ),
                params={
                    "address": param.address,
                    "orderBy": "balance",
                    "orderDirection": param.order_direction,
                },
            )

            self.assertEqual(len(holders), 2)
            self.assertEqual(holders[0].address, "0x123")
            self.assertEqual(holders[0].balance, 1000)
            self.assertEqual(holders[1].address, "0x456")
            self.assertEqual(holders[1].balance, 2000)

    def test_get_hmt_daily_data(self):
        param = StatisticsFilter(
            date_from=datetime.fromtimestamp(1683811973),
            date_to=datetime.fromtimestamp(1683812007),
        )
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.statistics.statistics_client.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "eventDayDatas": [
                            {
                                "timestamp": 1,
                                "dailyHMTTransferCount": "4",
                                "dailyHMTTransferAmount": "100",
                                "dailyUniqueSenders": "5",
                                "dailyUniqueReceivers": "5",
                            },
                        ],
                    }
                },
            ]

            hmt_statistics = self.statistics.get_hmt_daily_data(param)

            mock_function.assert_any_call(
                NETWORKS[ChainId.LOCALHOST],
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                    "first": 10,
                    "skip": 0,
                    "orderDirection": "asc",
                },
            )

            self.assertEqual(len(hmt_statistics), 1)
            self.assertEqual(hmt_statistics[0].timestamp, datetime.fromtimestamp(1))
            self.assertEqual(hmt_statistics[0].total_transaction_amount, 100)
            self.assertEqual(hmt_statistics[0].total_transaction_count, 4)
            self.assertEqual(hmt_statistics[0].daily_unique_senders, 5)
            self.assertEqual(hmt_statistics[0].daily_unique_receivers, 5)


if __name__ == "__main__":
    unittest.main(exit=True)
