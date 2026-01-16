"""Utility helpers for retrieving statistics information.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.statistics import StatisticsUtils

    stats = StatisticsUtils.get_escrow_statistics(ChainId.POLYGON_AMOY)
    ```
"""

from datetime import datetime
import logging

from typing import List, Optional

from human_protocol_sdk.constants import ChainId, NETWORKS

from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from human_protocol_sdk.filter import StatisticsFilter

LOG = logging.getLogger("human_protocol_sdk.statistics")


class StatisticsUtilsError(Exception):
    """Exception raised when errors occur during statistics operations."""

    pass


class HMTHoldersParam:
    """Filter parameters for querying HMT token holders.

    Attributes:
        address (Optional[str]): Optional holder address to filter by.
        order_direction (str): Sort direction - either "asc" or "desc".
    """

    def __init__(
        self,
        address: str = None,
        order_direction: str = "asc",
    ):
        self.address = address
        self.order_direction = order_direction


class DailyEscrowData:
    """Represents aggregated escrow metrics for a single day.

    Attributes:
        timestamp (datetime): Day boundary timestamp.
        escrows_total (int): Total number of escrows created on this day.
        escrows_pending (int): Number of escrows in pending status.
        escrows_solved (int): Number of escrows that were solved/completed.
        escrows_paid (int): Number of escrows that were paid out.
        escrows_cancelled (int): Number of escrows that were cancelled.
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
        self.timestamp = timestamp
        self.escrows_total = escrows_total
        self.escrows_pending = escrows_pending
        self.escrows_solved = escrows_solved
        self.escrows_paid = escrows_paid
        self.escrows_cancelled = escrows_cancelled


class EscrowStatistics:
    """Aggregate escrow statistics data.

    Attributes:
        total_escrows (int): Total number of escrows across all time.
        daily_escrows_data (List[DailyEscrowData]): Daily breakdown of escrow metrics.
    """

    def __init__(
        self,
        total_escrows: int,
        daily_escrows_data: List[DailyEscrowData],
    ):
        self.total_escrows = total_escrows
        self.daily_escrows_data = daily_escrows_data


class DailyWorkerData:
    """Represents aggregated worker metrics for a single day.

    Attributes:
        timestamp (datetime): Day boundary timestamp.
        active_workers (int): Number of active workers on this day.
    """

    def __init__(
        self,
        timestamp: datetime,
        active_workers: int,
    ):
        self.timestamp = timestamp
        self.active_workers = active_workers


class WorkerStatistics:
    """Aggregate worker statistics data.

    Attributes:
        daily_workers_data (List[DailyWorkerData]): Daily breakdown of worker metrics.
    """

    def __init__(
        self,
        daily_workers_data: List[DailyWorkerData],
    ):
        self.daily_workers_data = daily_workers_data


class DailyPaymentData:
    """Represents aggregated payment metrics for a single day.

    Attributes:
        timestamp (datetime): Day boundary timestamp.
        total_amount_paid (int): Total amount paid out on this day.
        total_count (int): Number of payment transactions.
        average_amount_per_worker (int): Average payout amount per worker.
    """

    def __init__(
        self,
        timestamp: datetime,
        total_amount_paid: int,
        total_count: int,
        average_amount_per_worker: int,
    ):
        self.timestamp = timestamp
        self.total_amount_paid = total_amount_paid
        self.total_count = total_count
        self.average_amount_per_worker = average_amount_per_worker


class PaymentStatistics:
    """Aggregate payment statistics data.

    Attributes:
        daily_payments_data (List[DailyPaymentData]): Daily breakdown of payment metrics.
    """

    def __init__(
        self,
        daily_payments_data: List[DailyPaymentData],
    ):
        self.daily_payments_data = daily_payments_data


class HMTHolder:
    """Represents an HMT token holder.

    Attributes:
        address (str): Ethereum address of the holder.
        balance (int): Token balance in smallest unit.
    """

    def __init__(
        self,
        address: str,
        balance: int,
    ):
        self.address = address
        self.balance = balance


class DailyHMTData:
    """Represents aggregated HMT transfer metrics for a single day.

    Attributes:
        timestamp (datetime): Day boundary timestamp.
        total_transaction_amount (int): Total amount transferred on this day.
        total_transaction_count (int): Number of transfer transactions.
        daily_unique_senders (int): Number of unique addresses sending tokens.
        daily_unique_receivers (int): Number of unique addresses receiving tokens.
    """

    def __init__(
        self,
        timestamp: datetime,
        total_transaction_amount: int,
        total_transaction_count: int,
        daily_unique_senders: int,
        daily_unique_receivers: int,
    ):
        self.timestamp = timestamp
        self.total_transaction_amount = total_transaction_amount
        self.total_transaction_count = total_transaction_count
        self.daily_unique_senders = daily_unique_senders
        self.daily_unique_receivers = daily_unique_receivers


class HMTStatistics:
    """Aggregate HMT token statistics.

    Attributes:
        total_transfer_amount (int): Total amount transferred across all time.
        total_transfer_count (int): Total number of transfer transactions.
        total_holders (int): Total number of token holders.
    """

    def __init__(
        self,
        total_transfer_amount: int,
        total_transfer_count: int,
        total_holders: int,
    ):
        self.total_transfer_amount = total_transfer_amount
        self.total_transfer_count = total_transfer_count
        self.total_holders = total_holders


class StatisticsUtils:
    """Utility class providing statistical data retrieval functions.

    This class offers static methods to fetch various statistics from the Human Protocol
    subgraph, including escrow metrics, worker activity, payment data, and HMT token statistics.
    """

    @staticmethod
    def get_escrow_statistics(
        chain_id: ChainId,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> EscrowStatistics:
        """Retrieve escrow statistics for a given date range.

        Fetches aggregate escrow data including total counts and daily breakdowns
        of escrow creation and status changes.

        Args:
            chain_id (ChainId): Network to retrieve statistics from.
            filter (StatisticsFilter): Date range and pagination filter. Defaults to all-time data.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Escrow statistics including total count and daily data.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils
            from human_protocol_sdk.filter import StatisticsFilter
            import datetime

            # Get all-time statistics
            stats = StatisticsUtils.get_escrow_statistics(ChainId.POLYGON_AMOY)
            print(f"Total escrows: {stats.total_escrows}")

            # Get statistics for specific date range
            stats = StatisticsUtils.get_escrow_statistics(
                ChainId.POLYGON_AMOY,
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            for day_data in stats.daily_escrows_data:
                print(f"{day_data.timestamp}: {day_data.escrows_total} escrows")
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
            get_escrow_statistics_query,
        )

        escrow_statistics_data = custom_gql_fetch(
            network,
            query=get_escrow_statistics_query,
            options=options,
        )
        escrow_statistics = escrow_statistics_data["data"]["escrowStatistics"]

        event_day_datas_data = custom_gql_fetch(
            network,
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

    @staticmethod
    def get_worker_statistics(
        chain_id: ChainId,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> WorkerStatistics:
        """Retrieve worker activity statistics for a given date range.

        Fetches daily worker activity metrics showing the number of active workers
        participating in escrows.

        Args:
            chain_id (ChainId): Network to retrieve statistics from.
            filter (StatisticsFilter): Date range and pagination filter. Defaults to all-time data.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Worker statistics with daily activity breakdown.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils
            from human_protocol_sdk.filter import StatisticsFilter
            import datetime

            stats = StatisticsUtils.get_worker_statistics(
                ChainId.POLYGON_AMOY,
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            for day_data in stats.daily_workers_data:
                print(f"{day_data.timestamp}: {day_data.active_workers} workers")
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            network,
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

    @staticmethod
    def get_payment_statistics(
        chain_id: ChainId,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> PaymentStatistics:
        """Retrieve payment statistics for a given date range.

        Fetches daily payment metrics including total amounts paid, transaction counts,
        and average payment per worker.

        Args:
            chain_id (ChainId): Network to retrieve statistics from.
            filter (StatisticsFilter): Date range and pagination filter. Defaults to all-time data.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Payment statistics with daily breakdown.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils
            from human_protocol_sdk.filter import StatisticsFilter
            import datetime

            stats = StatisticsUtils.get_payment_statistics(
                ChainId.POLYGON_AMOY,
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            for day_data in stats.daily_payments_data:
                print(f"{day_data.timestamp}: {day_data.total_amount_paid} paid")
                print(f"  Average per worker: {day_data.average_amount_per_worker}")
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            network,
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

    @staticmethod
    def get_hmt_statistics(
        chain_id: ChainId, options: Optional[SubgraphOptions] = None
    ) -> HMTStatistics:
        """Retrieve aggregate HMT token statistics.

        Fetches overall HMT token metrics including total transfers and holder counts.

        Args:
            chain_id (ChainId): Network to retrieve statistics from.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Aggregate HMT token statistics.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils

            stats = StatisticsUtils.get_hmt_statistics(ChainId.POLYGON_AMOY)
            print(f"Total holders: {stats.total_holders}")
            print(f"Total transfers: {stats.total_transfer_count}")
            print(f"Total amount transferred: {stats.total_transfer_amount}")
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.statistics import (
            get_hmtoken_statistics_query,
        )

        hmtoken_statistics_data = custom_gql_fetch(
            network,
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

    @staticmethod
    def get_hmt_holders(
        chain_id: ChainId,
        param: HMTHoldersParam = HMTHoldersParam(),
        options: Optional[SubgraphOptions] = None,
    ) -> List[HMTHolder]:
        """Retrieve HMT token holders with optional filters and ordering.

        Fetches a list of addresses holding HMT tokens with their balances.

        Args:
            chain_id (ChainId): Network to retrieve holder data from.
            param (HMTHoldersParam): Filter parameters and sort preferences.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            List of token holders with addresses and balances.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils, HMTHoldersParam

            # Get all holders sorted by balance ascending
            holders = StatisticsUtils.get_hmt_holders(ChainId.POLYGON_AMOY)
            for holder in holders:
                print(f"{holder.address}: {holder.balance}")

            # Get specific holder
            holders = StatisticsUtils.get_hmt_holders(
                ChainId.POLYGON_AMOY,
                HMTHoldersParam(
                    address="0x123...",
                    order_direction="desc",
                )
            )
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.hmtoken import get_holders_query

        holders_data = custom_gql_fetch(
            network,
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

    @staticmethod
    def get_hmt_daily_data(
        chain_id: ChainId,
        filter: StatisticsFilter = StatisticsFilter(),
        options: Optional[SubgraphOptions] = None,
    ) -> List[DailyHMTData]:
        """Retrieve daily HMT token transfer statistics for a given date range.

        Fetches daily metrics about HMT token transfers including amounts, counts,
        and unique participants.

        Args:
            chain_id (ChainId): Network to retrieve statistics from.
            filter (StatisticsFilter): Date range and pagination filter. Defaults to all-time data.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            List of daily HMT transfer statistics.

        Raises:
            StatisticsUtilsError: If the chain ID is invalid or network configuration is missing.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.statistics import StatisticsUtils
            from human_protocol_sdk.filter import StatisticsFilter
            import datetime

            daily_data = StatisticsUtils.get_hmt_daily_data(
                ChainId.POLYGON_AMOY,
                StatisticsFilter(
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            for day in daily_data:
                print(f"{day.timestamp}:")
                print(f"  Transfers: {day.total_transaction_count}")
                print(f"  Amount: {day.total_transaction_amount}")
                print(f"  Unique senders: {day.daily_unique_senders}")
            ```
        """
        if chain_id.value not in [cid.value for cid in ChainId]:
            raise StatisticsUtilsError(f"Invalid ChainId: {chain_id}")

        network = NETWORKS.get(chain_id)
        if not network:
            raise StatisticsUtilsError("Empty network configuration")

        from human_protocol_sdk.gql.statistics import (
            get_event_day_data_query,
        )

        event_day_datas_data = custom_gql_fetch(
            network,
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
