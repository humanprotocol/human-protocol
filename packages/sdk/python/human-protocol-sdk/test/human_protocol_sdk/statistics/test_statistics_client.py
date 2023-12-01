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
    StatisticsParam,
)


class TestStatisticsClient(unittest.TestCase):
    def setUp(self):
        self.statistics = StatisticsClient(ChainId.LOCALHOST)

    def test_init_with_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            StatisticsClient(ChainId(123))
        self.assertEqual(f"123 is not a valid ChainId", str(cm.exception))

    def test_get_escrow_statistics(self):
        param = StatisticsParam(
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
                "subgraph_url",
                query=get_escrow_statistics_query,
            )

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
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
        param = StatisticsParam(
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
                "subgraph_url",
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                },
            )

            self.assertEqual(len(payment_statistics.daily_workers_data), 1)
            self.assertEqual(
                payment_statistics.daily_workers_data[0].timestamp,
                datetime.fromtimestamp(1),
            )

    def test_get_payment_statistics(self):
        param = StatisticsParam(
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
                "subgraph_url",
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
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
        param = StatisticsParam(
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
                        "hmtokenStatistics": {
                            "totalValueTransfered": "100",
                            "totalTransferEventCount": "4",
                            "holders": "2",
                        },
                    }
                },
                {
                    "data": {
                        "holders": [
                            {
                                "address": "0x123",
                                "balance": "10",
                            },
                        ],
                    }
                },
                {
                    "data": {
                        "eventDayDatas": [
                            {
                                "timestamp": 1,
                                "dailyHMTTransferCount": "4",
                                "dailyHMTTransferAmount": "100",
                            },
                        ],
                    }
                },
            ]

            hmt_statistics = self.statistics.get_hmt_statistics(param)

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_hmtoken_statistics_query,
            )

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_holders_query,
            )

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_event_day_data_query(param),
                params={
                    "from": 1683811973,
                    "to": 1683812007,
                },
            )

            self.assertEqual(hmt_statistics.total_transfer_amount, 100)
            self.assertEqual(hmt_statistics.total_transfer_count, 4)
            self.assertEqual(hmt_statistics.total_holders, 2)
            self.assertEqual(len(hmt_statistics.holders), 1)
            self.assertEqual(hmt_statistics.holders[0].address, "0x123")
            self.assertEqual(hmt_statistics.holders[0].balance, 10)
            self.assertEqual(len(hmt_statistics.daily_hmt_data), 1)
            self.assertEqual(
                hmt_statistics.daily_hmt_data[0].timestamp, datetime.fromtimestamp(1)
            )
            self.assertEqual(
                hmt_statistics.daily_hmt_data[0].total_transaction_amount, 100
            )
            self.assertEqual(
                hmt_statistics.daily_hmt_data[0].total_transaction_count, 4
            )


if __name__ == "__main__":
    unittest.main(exit=True)
