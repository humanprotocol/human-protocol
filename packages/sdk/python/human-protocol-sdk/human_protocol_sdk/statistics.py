#!/usr/bin/env python3

from datetime import datetime
import logging
import os

from typing import List, Optional

from web3 import Web3

from human_protocol_sdk.constants import ChainId, NETWORKS
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
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: Optional[int] = None,
    ):
        """
        Initializes a StatisticsParam instance.

        Args:
            date_from (Optional[datetime]): Statistical data from date
            date_to (Optional[datetime]): Statistical data to date
            limit (Optional[int]): Limit of statistical data
        """

        self.date_from = date_from
        self.date_to = date_to
        self.limit = limit


class DailyEscrowData:
    """
    A class used to specify daily escrow data.
    """

    def __init__(
        self,
        timestamp: datetime,
        escrows_total: int,
        escrows_pending: int,
        escrows_solved: int,
        escrows_paid: int,
        escrows_cancelled: int,
    ):
        """
        Initializes a DailyEscrowData instance.

        Args:
            timestamp (datetime): Timestamp
            escrows_total (int): Total escrows
            escrows_pending (int): Pending escrows
            escrows_solved (int): Solved escrows
            escrows_paid (int): Paid escrows
            escrows_cancelled (int): Cancelled escrows
        """

        self.timestamp = timestamp
        self.escrows_total = escrows_total
        self.escrows_pending = escrows_pending
        self.escrows_solved = escrows_solved
        self.escrows_paid = escrows_paid
        self.escrows_cancelled = escrows_cancelled


class EscrowStatistics:
    """
    A class used to specify escrow statistics.
    """

    def __init__(
        self,
        total_escrows: int,
        daily_escrows_data: List[DailyEscrowData],
    ):
        """
        Initializes a EscrowStatistics instance.

        Args:
            total_escrows (int): Total escrows
            daily_escrows_data (List[DailyEscrowData]): Daily escrows data
        """

        self.total_escrows = total_escrows
        self.daily_escrows_data = daily_escrows_data


class DailyWorkerData:
    """
    A class used to specify daily worker data.
    """

    def __init__(
        self,
        timestamp: datetime,
        active_workers: int,
    ):
        """
        Initializes a DailyWorkerData instance.

        Args:
            timestamp (datetime): Timestamp
            active_workers (int): Active workers
        """

        self.timestamp = timestamp
        self.active_workers = active_workers


class WorkerStatistics:
    """
    A class used to specify worker statistics.
    """

    def __init__(
        self,
        daily_workers_data: List[DailyWorkerData],
    ):
        """
        Initializes a WorkerStatistics instance.

        Args:
            daily_workers_data (List[DailyWorkerData]): Daily workers data
        """

        self.daily_workers_data = daily_workers_data


class DailyPaymentData:
    """
    A class used to specify daily payment data.
    """

    def __init__(
        self,
        timestamp: datetime,
        total_amount_paid: int,
        total_count: int,
        average_amount_per_worker: int,
    ):
        """
        Initializes a DailyPaymentData instance.

        Args:
            timestamp (datetime): Timestamp
            total_amount_paid (int): Total amount paid
            total_count (int): Total count
            average_amount_per_worker (int): Average amount per worker
        """

        self.timestamp = timestamp
        self.total_amount_paid = total_amount_paid
        self.total_count = total_count
        self.average_amount_per_worker = average_amount_per_worker


class PaymentStatistics:
    """
    A class used to specify payment statistics.
    """

    def __init__(
        self,
        daily_payments_data: List[DailyPaymentData],
    ):
        """
        Initializes a PaymentStatistics instance.

        Args:
            daily_payments_data (List[DailyPaymentData]): Daily payments data
        """

        self.daily_payments_data = daily_payments_data


class HMTHolder:
    """
    A class used to specify HMT holder.
    """

    def __init__(
        self,
        address: str,
        balance: int,
    ):
        """
        Initializes a HMTHolder instance.

        Args:
            address (str): Address
            balance (int): Balance
        """

        self.address = address
        self.balance = balance


class DailyHMTData:
    """
    A class used to specify daily HMT data.
    """

    def __init__(
        self,
        timestamp: datetime,
        total_transaction_amount: int,
        total_transaction_count: int,
    ):
        """
        Initializes a DailyHMTData instance.

        Args:
            timestamp (datetime): Timestamp
            total_transaction_amount (int): Total transaction amount
            total_transaction_count (int): Total transaction count
        """

        self.timestamp = timestamp
        self.total_transaction_amount = total_transaction_amount
        self.total_transaction_count = total_transaction_count


class HMTStatistics:
    """
    A class used to specify HMT statistics.
    """

    def __init__(
        self,
        total_transfer_amount: int,
        total_transfer_count: int,
        total_holders: int,
        holders: List[HMTHolder],
        daily_hmt_data: List[DailyHMTData],
    ):
        """
        Initializes a HMTStatistics instance.

        Args:
            total_transfer_amount (int): Total transfer amount
            total_transfer_count (int): Total transfer count
            total_holders (int): Total holders
            holders (List[HMTHolder]): Holders
            daily_hmt_data (List[DailyHMTData]): Daily HMT data
        """

        self.total_transfer_amount = total_transfer_amount
        self.total_transfer_count = total_transfer_count
        self.total_holders = total_holders
        self.holders = holders
        self.daily_hmt_data = daily_hmt_data


class StatisticsClient:
    """
    A client used to get statistical data.
    """

    def __init__(self, w3: Web3):
        """Initializes a Statistics instance

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

    def get_escrow_statistics(
        self, param: StatisticsParam = StatisticsParam()
    ) -> EscrowStatistics:
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

        return EscrowStatistics(
            total_escrows=int(escrow_statistics["totalEscrowCount"]),
            daily_escrows_data=[
                DailyEscrowData(
                    timestamp=datetime.fromtimestamp(int(event_day_data["timestamp"])),
                    escrows_total=int(event_day_data["dailyEscrowCount"]),
                    escrows_pending=int(event_day_data["dailyPendingStatusEventCount"]),
                    escrows_solved=int(
                        event_day_data["dailyCompletedStatusEventCount"]
                    ),
                    escrows_paid=int(event_day_data["dailyPaidStatusEventCount"]),
                    escrows_cancelled=int(
                        event_day_data["dailyCancelledStatusEventCount"]
                    ),
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_worker_statistics(
        self, param: StatisticsParam = StatisticsParam()
    ) -> WorkerStatistics:
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

        return WorkerStatistics(
            daily_workers_data=[
                DailyWorkerData(
                    timestamp=datetime.fromtimestamp(int(event_day_data["timestamp"])),
                    active_workers=int(event_day_data["dailyWorkerCount"]),
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_payment_statistics(
        self, param: StatisticsParam = StatisticsParam()
    ) -> PaymentStatistics:
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

        return PaymentStatistics(
            daily_payments_data=[
                DailyPaymentData(
                    timestamp=datetime.fromtimestamp(int(event_day_data["timestamp"])),
                    total_amount_paid=int(event_day_data["dailyPayoutAmount"]),
                    total_count=int(event_day_data["dailyPayoutCount"]),
                    average_amount_per_worker=int(event_day_data["dailyPayoutAmount"])
                    / int(event_day_data["dailyWorkerCount"])
                    if event_day_data["dailyWorkerCount"] != "0"
                    else 0,
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_hmt_statistics(
        self, param: StatisticsParam = StatisticsParam()
    ) -> HMTStatistics:
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

        return HMTStatistics(
            total_transfer_amount=int(hmtoken_statistics["totalValueTransfered"]),
            total_transfer_count=int(hmtoken_statistics["totalTransferEventCount"]),
            total_holders=int(hmtoken_statistics["holders"]),
            holders=[
                HMTHolder(
                    address=holder["address"],
                    balance=int(holder["balance"]),
                )
                for holder in holders
            ],
            daily_hmt_data=[
                DailyHMTData(
                    timestamp=datetime.fromtimestamp(int(event_day_data["timestamp"])),
                    total_transaction_amount=int(
                        event_day_data["dailyHMTTransferAmount"]
                    ),
                    total_transaction_count=int(
                        event_day_data["dailyHMTTransferCount"]
                    ),
                )
                for event_day_data in event_day_datas
            ],
        )
