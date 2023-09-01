#!/usr/bin/env python3

import datetime
import logging
import os

from typing import Optional

from web3 import Web3

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.gql.hmtoken import get_holders_query

from human_protocol_sdk.utils import (
    get_data_from_subgraph,
)

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.statistics")


class StatisticsClientError(Exception):
    """
    Raises when some error happens when getting data from subgraph.
    """

    pass


class StatisticsParam:
    """
    A class used to specify statistics params.
    """

    def __init__(
        self,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
    ):
        """
        Initializes a StatisticsParam instance.

        Args:
            date_from (Optional[datetime.datetime]): Statistical data from date
            date_to (Optional[datetime.datetime]): Statistical data to date
        """

        self.date_from = date_from
        self.date_to = date_to


class StatisticsClient:
    """
    A client used to get statistical data.
    """

    def __init__(self, w3: Web3):
        """Initializes a Staking instance

        Args:

        """

        # Initialize web3 instance
        self.w3 = w3

        chain_id = None
        # Load network configuration based on chain_id
        try:
            chain_id = self.w3.eth.chain_id
            self.network = NETWORKS[ChainId(chain_id)]
        except:
            if chain_id is not None:
                raise StatisticsClientError(f"Invalid ChainId: {chain_id}")
            else:
                raise StatisticsClientError(f"Invalid Web3 Instance")

        if not self.network:
            raise StatisticsClientError("Empty network configuration")

    def get_escrow_statistics(self, param: StatisticsParam = StatisticsParam()) -> dict:
        """Get escrow statistics data for the given date range.

        Args:
            param (StatisticsParam): Object containing the date range

        Returns:
            dict: Escrow statistics data
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_escrow_statistics_query,
        )

        escrow_statistics_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_escrow_statistics_query,
        )
        escrow_statistics = escrow_statistics_data["data"]["escrowStatistics"]

        event_day_datas_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_event_day_data_query(param),
            params={
                "from": int(param.date_from.timestamp()) if param.date_from else None,
                "to": int(param.date_to.timestamp()) if param.date_to else None,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return {
            "total_escrows": int(escrow_statistics["totalEscrowCount"]),
            "daily_escrows_data": [
                {
                    "timestamp": datetime.datetime.fromtimestamp(
                        int(event_day_data["timestamp"])
                    ),
                    "escrows_total": int(event_day_data["dailyEscrowCount"]),
                    "escrows_pending": int(
                        event_day_data["dailyPendingStatusEventCount"]
                    ),
                    "escrows_solved": int(
                        event_day_data["dailyCompletedStatusEventCount"]
                    ),
                    "escrows_paid": int(event_day_data["dailyPaidStatusEventCount"]),
                    "escrows_cancelled": int(
                        event_day_data["dailyCancelledStatusEventCount"]
                    ),
                }
                for event_day_data in event_day_datas
            ],
        }

    def get_worker_statistics(self, param: StatisticsParam = StatisticsParam()) -> dict:
        """Get worker statistics data for the given date range.

        Args:
            param (StatisticsParam): Object containing the date range

        Returns:
            dict: Worker statistics data
        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_event_day_data_query(param),
            params={
                "from": int(param.date_from.timestamp()) if param.date_from else None,
                "to": int(param.date_to.timestamp()) if param.date_to else None,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return {
            "daily_workers_data": [
                {
                    "timestamp": datetime.datetime.fromtimestamp(
                        int(event_day_data["timestamp"])
                    ),
                    "active_workers": int(event_day_data["dailyWorkerCount"]),
                    "average_jobs_solved": int(
                        event_day_data["dailyBulkPayoutEventCount"]
                    )
                    / int(event_day_data["dailyWorkerCount"])
                    if event_day_data["dailyWorkerCount"] != "0"
                    else 0,
                }
                for event_day_data in event_day_datas
            ],
        }

    def get_payment_statistics(
        self, param: StatisticsParam = StatisticsParam()
    ) -> dict:
        """Get payment statistics data for the given date range.

        Args:
            param (StatisticsParam): Object containing the date range

        Returns:
            dict: Payment statistics data

        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_event_day_data_query(param),
            params={
                "from": int(param.date_from.timestamp()) if param.date_from else None,
                "to": int(param.date_to.timestamp()) if param.date_to else None,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return {
            "daily_payments_data": [
                {
                    "timestamp": datetime.datetime.fromtimestamp(
                        int(event_day_data["timestamp"])
                    ),
                    "total_amount_paid": int(event_day_data["dailyPayoutAmount"]),
                    "total_count": int(event_day_data["dailyPayoutCount"]),
                    "average_amount_per_job": int(event_day_data["dailyPayoutAmount"])
                    / int(event_day_data["dailyBulkPayoutEventCount"])
                    if event_day_data["dailyBulkPayoutEventCount"] != "0"
                    else 0,
                    "average_amount_per_worker": int(
                        event_day_data["dailyPayoutAmount"]
                    )
                    / int(event_day_data["dailyWorkerCount"])
                    if event_day_data["dailyWorkerCount"] != "0"
                    else 0,
                }
                for event_day_data in event_day_datas
            ],
        }

    def get_hmt_statistics(self, param: StatisticsParam = StatisticsParam()) -> dict:
        """Get HMT statistics data for the given date range.

        Args:
            param (StatisticsParam): Object containing the date range

        Returns:
            dict: HMT statistics data
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_hmtoken_statistics_query,
        )

        hmtoken_statistics_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_hmtoken_statistics_query,
        )
        hmtoken_statistics = hmtoken_statistics_data["data"]["hmtokenStatistics"]

        holders_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_holders_query,
        )
        holders = holders_data["data"]["holders"]

        event_day_datas_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_event_day_data_query(param),
            params={
                "from": int(param.date_from.timestamp()) if param.date_from else None,
                "to": int(param.date_to.timestamp()) if param.date_to else None,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return {
            "total_transfer_amount": int(hmtoken_statistics["totalValueTransfered"]),
            "total_holders": int(hmtoken_statistics["holders"]),
            "holders": [
                {
                    "address": holder["address"],
                    "balance": int(holder["balance"]),
                }
                for holder in holders
            ],
            "daily_hmt_data": [
                {
                    "timestamp": datetime.datetime.fromtimestamp(
                        int(event_day_data["timestamp"])
                    ),
                    "total_transaction_amount": int(
                        event_day_data["dailyHMTTransferAmount"]
                    ),
                    "total_transaction_count": int(
                        event_day_data["dailyHMTTransferCount"]
                    ),
                }
                for event_day_data in event_day_datas
            ],
        }
