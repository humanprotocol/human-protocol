#!/usr/bin/env python3

import datetime
import logging
import os

from typing import Optional

import requests
from web3 import Web3

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.filter import PayoutFilter
from human_protocol_sdk.gql.hmtoken import get_holders_query

from human_protocol_sdk.utils import get_data_from_subgraph

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
        limit: Optional[int] = None,
    ):
        """
        Initializes a StatisticsParam instance.

        Args:
            date_from (Optional[datetime.datetime]): Statistical data from date
            date_to (Optional[datetime.datetime]): Statistical data to date
            limit (Optional[int]): Limit of statistical data
        """

        self.date_from = date_from
        self.date_to = date_to
        self.limit = limit


class StatisticsClient:
    """
    A client used to get statistical data.
    """

    def __init__(self, w3: Web3, im_api_key: str):
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

        # Keep IM API key
        self.im_api_key = im_api_key

    def get_data_from_im_api(self, param: StatisticsParam):
        # TODO: Remove this when IM API supports other networks
        if self.network["name"] != "Polygon":
            return {}

        if param.date_from:
            date_from = datetime.datetime.strftime(param.date_from, "%Y-%m-%d")
        else:
            date_from = (
                datetime.datetime.now() - datetime.timedelta(days=60)
            ).strftime("%Y-%m-%d")

        if param.date_to:
            date_to = datetime.datetime.strftime(param.date_to, "%Y-%m-%d")
        else:
            date_to = datetime.datetime.now().strftime("%Y-%m-%d")

        # IM API now limits the date range to 60 days, so we need to make multiple requests
        # if the date range is greater than 60 days
        date_from = datetime.datetime.strptime(date_from, "%Y-%m-%d")
        date_to = datetime.datetime.strptime(date_to, "%Y-%m-%d")
        date_range = date_to - date_from
        date_chunks = []
        chunk_size = 60
        for i in range(0, date_range.days, chunk_size):
            date_chunks.append(
                {
                    "date_from": (date_from + datetime.timedelta(days=i)).strftime(
                        "%Y-%m-%d"
                    ),
                    "date_to": (
                        date_from + datetime.timedelta(days=i + chunk_size)
                    ).strftime("%Y-%m-%d"),
                }
            )
        if date_range.days % chunk_size != 0:
            date_chunks.append(
                {
                    "date_from": (
                        date_from
                        + datetime.timedelta(
                            days=date_range.days - (date_range.days % chunk_size)
                        )
                    ).strftime("%Y-%m-%d"),
                    "date_to": date_to.strftime("%Y-%m-%d"),
                }
            )

        im_data = {}
        for date_chunk in date_chunks:
            data = requests.get(
                "https://foundation-accounts.hmt.ai//support/summary-stats",
                params={
                    "start_date": date_chunk["date_from"],
                    "end_date": date_chunk["date_to"],
                    "api_key": self.im_api_key,
                },
            ).json()

            for key in data:
                if key != "total":
                    im_data[key] = data[key]

        return im_data

    def get_task_statistics(self, param: StatisticsParam = StatisticsParam()) -> dict:
        """Get task statistics data for the given date range.

        Args:
            param (StatisticsParam): Object containing the date range

        Returns:
            dict: Task statistics data
        """
        im_data = self.get_data_from_im_api(param)

        return {
            "daily_tasks_data": [
                {
                    "timestamp": datetime.datetime.strptime(key, "%Y-%m-%d"),
                    "tasks_total": im_data[key]["served"],
                    "tasks_solved": im_data[key]["solved"],
                }
                for key in im_data
            ],
        }

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

        from human_protocol_sdk.gql.payout import get_payouts_query

        im_data = self.get_data_from_im_api(param)

        daily_workers_data = []
        for key in im_data:
            date_from = datetime.datetime.strptime(key, "%Y-%m-%d")
            date_to = date_from + datetime.timedelta(days=1)

            payouts_data = get_data_from_subgraph(
                self.network["subgraph_url"],
                query=get_payouts_query(
                    PayoutFilter(date_from=date_from, date_to=date_to)
                ),
                params={
                    "from": int(date_from.timestamp()),
                    "to": int(date_to.timestamp()),
                },
            )
            payouts = payouts_data["data"]["payouts"]

            active_workers = len(set([payout["recipient"] for payout in payouts]))

            daily_workers_data.append(
                {
                    "timestamp": date_from,
                    "active_workers": active_workers,
                    "average_jobs_solved": im_data[key]["solved"] / active_workers
                    if active_workers != 0
                    else 0,
                }
            )

        return {
            "daily_workers_data": daily_workers_data,
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
