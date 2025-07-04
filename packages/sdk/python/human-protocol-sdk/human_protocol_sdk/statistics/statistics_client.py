"""
This client enables to obtain statistical information from the subgraph.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.statistics import StatisticsClient

    statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

Module
------
"""

from datetime import datetime
import logging

from typing import List, Optional

from human_protocol_sdk.constants import ChainId, NETWORKS

from human_protocol_sdk.utils import get_data_from_subgraph
from human_protocol_sdk.filter import StatisticsFilter

LOG = logging.getLogger("human_protocol_sdk.statistics")


class StatisticsClientError(Exception):
    """
    Raises when some error happens when getting data from subgraph.
    """

    pass


class HMTHoldersParam:
    """
    A class used to specify parameters for querying HMT holders.
    """

    def __init__(
        self,
        address: str = None,
        order_direction: str = "asc",
    ):
        """
        Initializes a HMTHoldersParam instance.

        :param address: Filter by holder's address
        :param order_direction: Optional. Direction of sorting ('asc' for ascending, 'desc' for descending)
        """
        self.address = address
        self.order_direction = order_direction


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

        :param timestamp: Timestamp
        :param escrows_total: Total escrows
        :param escrows_pending: Pending escrows
        :param escrows_solved: Solved escrows
        :param escrows_paid: Paid escrows
        :param escrows_cancelled: Cancelled escrows
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

        :param total_escrows: Total escrows
        :param daily_escrows_data: Daily escrows data
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

        :param timestamp: Timestamp
        :param active_workers: Active workers
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

        :param daily_workers_data: Daily workers data
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

        :param timestamp: Timestamp
        :param total_amount_paid: Total amount paid
        :param total_count: Total count
        :param average_amount_per_worker: Average amount per worker
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

        :param daily_payments_data: Daily payments data
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

        :param address: Holder address
        :param balance: Holder balance
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
        daily_unique_senders: int,
        daily_unique_receivers: int,
    ):
        """
        Initializes a DailyHMTData instance.

        :param timestamp: Timestamp
        :param total_transaction_amount: Total transaction amount
        :param total_transaction_count: Total transaction count
        :param daily_unique_senders: Total unique senders
        :param daily_unique_receivers: Total unique receivers
        """

        self.timestamp = timestamp
        self.total_transaction_amount = total_transaction_amount
        self.total_transaction_count = total_transaction_count
        self.daily_unique_senders = daily_unique_senders
        self.daily_unique_receivers = daily_unique_receivers


class HMTStatistics:
    """
    A class used to specify HMT statistics.
    """

    def __init__(
        self,
        total_transfer_amount: int,
        total_transfer_count: int,
        total_holders: int,
    ):
        """
        Initializes a HMTStatistics instance.

        :param total_transfer_amount: Total transfer amount
        :param total_transfer_count: Total transfer count
        :param total_holders: Total holders
        """

        self.total_transfer_amount = total_transfer_amount
        self.total_transfer_count = total_transfer_count
        self.total_holders = total_holders


class StatisticsClient:
    """
    A client used to get statistical data.
    """

    def __init__(self, chain_id: ChainId = ChainId.POLYGON_AMOY):
        """Initializes a Statistics instance

        :param chain_id: Chain ID to get statistical data from

        """

        if chain_id.value not in [chain_id.value for chain_id in ChainId]:
            raise StatisticsClientError(f"Invalid ChainId: {chain_id}")

        self.network = NETWORKS[ChainId(chain_id)]

        if not self.network:
            raise StatisticsClientError("Empty network configuration")

    def get_escrow_statistics(
        self, filter: StatisticsFilter = StatisticsFilter()
    ) -> EscrowStatistics:
        """Get escrow statistics data for the given date range.

        :param filter: Object containing the date range

        :return: Escrow statistics data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient
                from human_protocol_sdk.filter import StatisticsFilter

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_escrow_statistics())
                print(
                    statistics_client.get_escrow_statistics(
                        StatisticsFilter(
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_escrow_statistics_query,
        )

        escrow_statistics_data = get_data_from_subgraph(
            self.network,
            query=get_escrow_statistics_query,
        )
        escrow_statistics = escrow_statistics_data["data"]["escrowStatistics"]

        event_day_datas_data = get_data_from_subgraph(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return EscrowStatistics(
            total_escrows=int(escrow_statistics.get("totalEscrowCount", 0)),
            daily_escrows_data=[
                DailyEscrowData(
                    timestamp=datetime.fromtimestamp(
                        int(event_day_data.get("timestamp", 0))
                    ),
                    escrows_total=int(event_day_data.get("dailyEscrowCount", 0)),
                    escrows_pending=int(
                        event_day_data.get("dailyPendingStatusEventCount", 0)
                    ),
                    escrows_solved=int(
                        event_day_data.get("dailyCompletedStatusEventCount", 0)
                    ),
                    escrows_paid=int(
                        event_day_data.get("dailyPaidStatusEventCount", 0)
                    ),
                    escrows_cancelled=int(
                        event_day_data.get("dailyCancelledStatusEventCount", 0)
                    ),
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_worker_statistics(
        self, filter: StatisticsFilter = StatisticsFilter()
    ) -> WorkerStatistics:
        """Get worker statistics data for the given date range.

        :param filter: Object containing the date range

        :return: Worker statistics data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient
                from human_protocol_sdk.filter import StatisticsFilter

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_worker_statistics())
                print(
                    statistics_client.get_worker_statistics(
                        StatisticsFilter(
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = get_data_from_subgraph(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return WorkerStatistics(
            daily_workers_data=[
                DailyWorkerData(
                    timestamp=datetime.fromtimestamp(
                        int(event_day_data.get("timestamp", 0))
                    ),
                    active_workers=int(event_day_data.get("dailyWorkerCount", 0)),
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_payment_statistics(
        self, filter: StatisticsFilter = StatisticsFilter()
    ) -> PaymentStatistics:
        """Get payment statistics data for the given date range.

        :param filter: Object containing the date range

        :return: Payment statistics data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient
                from human_protocol_sdk.filter import StatisticsFilter

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_payment_statistics())
                print(
                    statistics_client.get_payment_statistics(
                        StatisticsFilter(
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = get_data_from_subgraph(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return PaymentStatistics(
            daily_payments_data=[
                DailyPaymentData(
                    timestamp=datetime.fromtimestamp(
                        int(event_day_data.get("timestamp", 0))
                    ),
                    total_amount_paid=int(
                        event_day_data.get("dailyHMTPayoutAmount", 0)
                    ),
                    total_count=int(event_day_data.get("dailyPayoutCount", 0)),
                    average_amount_per_worker=(
                        int(event_day_data.get("dailyHMTPayoutAmount", 0))
                        / int(event_day_data.get("dailyWorkerCount"))
                        if event_day_data.get("dailyWorkerCount", "0") != "0"
                        else 0
                    ),
                )
                for event_day_data in event_day_datas
            ],
        )

    def get_hmt_statistics(self) -> HMTStatistics:
        """Get HMT statistics data.

        :return: HMT statistics data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_hmt_statistics())
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_hmtoken_statistics_query,
        )

        hmtoken_statistics_data = get_data_from_subgraph(
            self.network,
            query=get_hmtoken_statistics_query,
        )
        hmtoken_statistics = hmtoken_statistics_data["data"]["hmtokenStatistics"]

        return HMTStatistics(
            total_transfer_amount=int(
                hmtoken_statistics.get("totalValueTransfered", 0)
            ),
            total_transfer_count=int(
                hmtoken_statistics.get("totalTransferEventCount", 0)
            ),
            total_holders=int(hmtoken_statistics.get("holders", 0)),
        )

    def get_hmt_holders(
        self, param: HMTHoldersParam = HMTHoldersParam()
    ) -> List[HMTHolder]:
        """Get HMT holders data with optional filters and ordering.

        :param param: Object containing filter and order parameters

        :return: List of HMT holders

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient, HMTHoldersParam

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_hmt_holders())
                print(
                    statistics_client.get_hmt_holders(
                        HMTHoldersParam(
                            address="0x123...",
                            order_direction="asc",
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.hmtoken import get_holders_query

        holders_data = get_data_from_subgraph(
            self.network,
            query=get_holders_query(address=param.address),
            params={
                "address": param.address,
                "orderBy": "balance",
                "orderDirection": param.order_direction,
            },
        )

        holders = holders_data["data"]["holders"]

        return [
            HMTHolder(
                address=holder.get("address", ""),
                balance=int(holder.get("balance", 0)),
            )
            for holder in holders
        ]

    def get_hmt_daily_data(
        self, filter: StatisticsFilter = StatisticsFilter()
    ) -> List[DailyHMTData]:
        """Get HMT daily statistics data for the given date range.

        :param filter: Object containing the date range

        :return: HMT statistics data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.statistics import StatisticsClient, StatisticsFilter

                statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

                print(statistics_client.get_hmt_daily_data())
                print(
                    statistics_client.get_hmt_daily_data(
                        StatisticsFilter(
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = get_data_from_subgraph(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )
        event_day_datas = event_day_datas_data["data"]["eventDayDatas"]

        return [
            DailyHMTData(
                timestamp=datetime.fromtimestamp(
                    int(event_day_data.get("timestamp", 0))
                ),
                total_transaction_amount=int(
                    event_day_data.get("dailyHMTTransferAmount", 0)
                ),
                total_transaction_count=int(
                    event_day_data.get("dailyHMTTransferCount", 0)
                ),
                daily_unique_senders=int(event_day_data.get("dailyUniqueSenders", 0)),
                daily_unique_receivers=int(
                    event_day_data.get("dailyUniqueReceivers", 0)
                ),
            )
            for event_day_data in event_day_datas
        ]
