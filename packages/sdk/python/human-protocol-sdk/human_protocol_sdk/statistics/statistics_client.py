"""Client to retrieve statistical information from the subgraph.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.statistics import StatisticsClient

    statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
    ```
"""

from datetime import datetime
import logging

from typing import List, Optional

from human_protocol_sdk.constants import ChainId, NETWORKS

from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from human_protocol_sdk.filter import StatisticsFilter

LOG = logging.getLogger("human_protocol_sdk.statistics")


class StatisticsClientError(Exception):
    """Raised when an error occurs fetching data from the subgraph."""

    pass


class HMTHoldersParam:
    """Parameters for querying HMT holders."""

    def __init__(
        self,
        address: str = None,
        order_direction: str = "asc",
    ):
        """Create holder query parameters.

        Args:
            address: Optional holder address filter.
            order_direction: Sort direction (`asc` or `desc`).
        """
        self.address = address
        self.order_direction = order_direction


class DailyEscrowData:
    """Aggregated daily escrow metrics."""

    def __init__(
        self,
        timestamp: datetime,
        escrows_total: int,
        escrows_pending: int,
        escrows_solved: int,
        escrows_paid: int,
        escrows_cancelled: int,
    ):
        """Initialize a daily escrow record.

        Args:
            timestamp: Day boundary timestamp.
            escrows_total: Total escrows.
            escrows_pending: Pending escrows.
            escrows_solved: Solved escrows.
            escrows_paid: Paid escrows.
            escrows_cancelled: Cancelled escrows.
        """

        self.timestamp = timestamp
        self.escrows_total = escrows_total
        self.escrows_pending = escrows_pending
        self.escrows_solved = escrows_solved
        self.escrows_paid = escrows_paid
        self.escrows_cancelled = escrows_cancelled


class EscrowStatistics:
    """Escrow statistics data."""

    def __init__(
        self,
        total_escrows: int,
        daily_escrows_data: List[DailyEscrowData],
    ):
        """Initialize escrow statistics.

        Args:
            total_escrows: Total escrows.
            daily_escrows_data: Per-day escrow data.
        """

        self.total_escrows = total_escrows
        self.daily_escrows_data = daily_escrows_data


class DailyWorkerData:
    """Aggregated daily worker metrics."""

    def __init__(
        self,
        timestamp: datetime,
        active_workers: int,
    ):
        """Initialize a daily worker record.

        Args:
            timestamp: Day boundary timestamp.
            active_workers: Number of active workers.
        """

        self.timestamp = timestamp
        self.active_workers = active_workers


class WorkerStatistics:
    """Worker statistics data."""

    def __init__(
        self,
        daily_workers_data: List[DailyWorkerData],
    ):
        """Initialize worker statistics.

        Args:
            daily_workers_data: Per-day worker data.
        """

        self.daily_workers_data = daily_workers_data


class DailyPaymentData:
    """Aggregated daily payment metrics."""

    def __init__(
        self,
        timestamp: datetime,
        total_amount_paid: int,
        total_count: int,
        average_amount_per_worker: int,
    ):
        """Initialize a daily payment record.

        Args:
            timestamp: Day boundary timestamp.
            total_amount_paid: Total amount paid.
            total_count: Payment count.
            average_amount_per_worker: Average payout per worker.
        """

        self.timestamp = timestamp
        self.total_amount_paid = total_amount_paid
        self.total_count = total_count
        self.average_amount_per_worker = average_amount_per_worker


class PaymentStatistics:
    """Payment statistics data."""

    def __init__(
        self,
        daily_payments_data: List[DailyPaymentData],
    ):
        """Initialize payment statistics.

        Args:
            daily_payments_data: Per-day payment data.
        """

        self.daily_payments_data = daily_payments_data


class HMTHolder:
    """HMT holder record."""

    def __init__(
        self,
        address: str,
        balance: int,
    ):
        """Initialize a holder record.

        Args:
            address: Holder address.
            balance: Holder balance.
        """

        self.address = address
        self.balance = balance


class DailyHMTData:
    """Aggregated daily HMT transfer metrics."""

    def __init__(
        self,
        timestamp: datetime,
        total_transaction_amount: int,
        total_transaction_count: int,
        daily_unique_senders: int,
        daily_unique_receivers: int,
    ):
        """Initialize daily HMT transfer data.

        Args:
            timestamp: Day boundary timestamp.
            total_transaction_amount: Total transfer amount.
            total_transaction_count: Total transfer count.
            daily_unique_senders: Unique senders.
            daily_unique_receivers: Unique receivers.
        """

        self.timestamp = timestamp
        self.total_transaction_amount = total_transaction_amount
        self.total_transaction_count = total_transaction_count
        self.daily_unique_senders = daily_unique_senders
        self.daily_unique_receivers = daily_unique_receivers


class HMTStatistics:
    """HMT aggregate statistics."""

    def __init__(
        self,
        total_transfer_amount: int,
        total_transfer_count: int,
        total_holders: int,
    ):
        """Initialize HMT statistics.

        Args:
            total_transfer_amount: Total transfer amount.
            total_transfer_count: Total transfer count.
            total_holders: Total holder count.
        """

        self.total_transfer_amount = total_transfer_amount
        self.total_transfer_count = total_transfer_count
        self.total_holders = total_holders


class StatisticsClient:
    """Client for retrieving statistical data."""

    def __init__(self, chain_id: ChainId = ChainId.POLYGON_AMOY):
        """Create a statistics client.

        Args:
            chain_id: Chain ID to read statistical data from.

        Raises:
            StatisticsClientError: If the chain ID is invalid or config is missing.
        """

        if chain_id.value not in [chain_id.value for chain_id in ChainId]:
            raise StatisticsClientError(f"Invalid ChainId: {chain_id}")

        self.network = NETWORKS[ChainId(chain_id)]

        if not self.network:
            raise StatisticsClientError("Empty network configuration")

    def get_escrow_statistics(
        self,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> EscrowStatistics:
        """Get escrow statistics data for the given date range.

        Args:
            filter: Date range and pagination filter.
            options: Optional subgraph request configuration.

        Returns:
            Escrow statistics data.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient
            from human_protocol_sdk.filter import StatisticsFilter

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

            statistics_client.get_escrow_statistics()
            statistics_client.get_escrow_statistics(
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            ```
        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_escrow_statistics_query,
        )

        escrow_statistics_data = custom_gql_fetch(
            self.network,
            query=get_escrow_statistics_query,
            options=options,
        )
        escrow_statistics = escrow_statistics_data["data"]["escrowStatistics"]

        event_day_datas_data = custom_gql_fetch(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
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
        self,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> WorkerStatistics:
        """Get worker statistics data for the given date range.

        Args:
            filter: Date range and pagination filter.
            options: Optional subgraph request configuration.

        Returns:
            Worker statistics data.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient
            from human_protocol_sdk.filter import StatisticsFilter

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

            statistics_client.get_worker_statistics()
            statistics_client.get_worker_statistics(
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            ```
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
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
        self,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> PaymentStatistics:
        """Get payment statistics data for the given date range.

        Args:
            filter: Date range and pagination filter.
            options: Optional subgraph request configuration.

        Returns:
            Payment statistics data.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient
            from human_protocol_sdk.filter import StatisticsFilter

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

            statistics_client.get_payment_statistics()
            statistics_client.get_payment_statistics(
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            ```
        """

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
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

    def get_hmt_statistics(
        self, options: Optional[SubgraphOptions] = None
    ) -> HMTStatistics:
        """Get HMT statistics data.

        Args:
            options: Optional subgraph request configuration.

        Returns:
            HMT statistics data.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
            statistics_client.get_hmt_statistics()
            ```
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_hmtoken_statistics_query,
        )

        hmtoken_statistics_data = custom_gql_fetch(
            self.network,
            query=get_hmtoken_statistics_query,
            options=options,
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
        self,
        param: HMTHoldersParam = HMTHoldersParam(),
        options: Optional[SubgraphOptions] = None,
    ) -> List[HMTHolder]:
        """Get HMT holders data with optional filters and ordering.

        Args:
            param: Holder filters and sort preferences.
            options: Optional subgraph request configuration.

        Returns:
            List of HMT holders.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient, HMTHoldersParam

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

            statistics_client.get_hmt_holders()
            statistics_client.get_hmt_holders(
                HMTHoldersParam(
                    address="0x123...",
                    order_direction="asc",
                )
            )
            ```
        """
        from human_protocol_sdk.gql.hmtoken import get_holders_query

        holders_data = custom_gql_fetch(
            self.network,
            query=get_holders_query(address=param.address),
            params={
                "address": param.address,
                "orderBy": "balance",
                "orderDirection": param.order_direction,
            },
            options=options,
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
        self,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> List[DailyHMTData]:
        """Get HMT daily statistics data for the given date range.

        Args:
            filter: Date range and pagination filter.
            options: Optional subgraph request configuration.

        Returns:
            Daily HMT transfer statistics.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsClient, StatisticsFilter

            statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

            statistics_client.get_hmt_daily_data()
            statistics_client.get_hmt_daily_data(
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            ```
        """
        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            self.network,
            query=get_event_day_data_query(filter),
            params={
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
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
