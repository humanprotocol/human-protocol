#!/usr/bin/env python3

"""Filter classes for querying Human Protocol subgraph data.

This module provides filter classes for various query operations including escrows,
payouts, transactions, statistics, and more.
"""

from datetime import datetime

from typing import List, Optional

from human_protocol_sdk.constants import ChainId, Status, OrderDirection

from web3 import Web3


class FilterError(Exception):
    """Exception raised when filter construction or validation fails."""

    pass


class EscrowFilter:
    """Filter configuration for querying escrows from the subgraph.

    Attributes:
        chain_id (ChainId): Network to request data from.
        launcher (Optional[str]): Launcher address to filter by.
        reputation_oracle (Optional[str]): Reputation oracle address to filter by.
        recording_oracle (Optional[str]): Recording oracle address to filter by.
        exchange_oracle (Optional[str]): Exchange oracle address to filter by.
        job_requester_id (Optional[str]): Job requester identifier to filter by.
        status (Optional[Status | List[Status]]): Escrow status or list of statuses to filter by.
        date_from (Optional[datetime]): Filter escrows created from this date.
        date_to (Optional[datetime]): Filter escrows created until this date.
        first (int): Number of items per page (max 1000).
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.
    """

    def __init__(
        self,
        chain_id: ChainId,
        launcher: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
        job_requester_id: Optional[str] = None,
        status: Optional[Status | List[Status]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Raises:
            FilterError: If chain ID is invalid, addresses are malformed, date range is invalid,
                or order direction is invalid.
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise FilterError(f"Invalid ChainId")

        if launcher and not Web3.is_address(launcher):
            raise FilterError(f"Invalid address: {launcher}")

        if reputation_oracle and not Web3.is_address(reputation_oracle):
            raise FilterError(f"Invalid address: {reputation_oracle}")

        if recording_oracle and not Web3.is_address(recording_oracle):
            raise FilterError(f"Invalid address: {recording_oracle}")

        if exchange_oracle and not Web3.is_address(exchange_oracle):
            raise FilterError(f"Invalid address: {exchange_oracle}")

        if date_from and date_to and date_from > date_to:
            raise FilterError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise FilterError(f"Invalid order: {order_direction}")

        self.chain_id = chain_id
        self.launcher = launcher
        self.reputation_oracle = reputation_oracle
        self.recording_oracle = recording_oracle
        self.exchange_oracle = exchange_oracle
        self.job_requester_id = job_requester_id
        self.status = status
        self.date_from = date_from
        self.date_to = date_to
        self.first = min(first, 1000)
        self.skip = skip
        self.order_direction = order_direction


class PayoutFilter:
    """Filter configuration for querying payout events from the subgraph.

    Attributes:
        chain_id (ChainId): Chain where payouts were recorded.
        escrow_address (Optional[str]): Escrow address to filter payouts by.
        recipient (Optional[str]): Recipient address to filter payouts by.
        date_from (Optional[datetime]): Filter payouts from this date.
        date_to (Optional[datetime]): Filter payouts until this date.
        first (int): Number of items per page.
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.
    """

    def __init__(
        self,
        chain_id: ChainId,
        escrow_address: Optional[str] = None,
        recipient: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Raises:
            FilterError: If addresses are malformed or date range is invalid.
        """

        if escrow_address and not Web3.is_address(escrow_address):
            raise FilterError(f"Invalid address: {escrow_address}")

        if recipient and not Web3.is_address(recipient):
            raise FilterError(f"Invalid address: {recipient}")

        if date_from and date_to and date_from > date_to:
            raise FilterError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        self.chain_id = chain_id
        self.escrow_address = escrow_address
        self.recipient = recipient
        self.date_from = date_from
        self.date_to = date_to
        self.first = first
        self.skip = skip
        self.order_direction = order_direction


class TransactionFilter:
    """Filter configuration for querying blockchain transactions from the subgraph.

    Attributes:
        chain_id (ChainId): Chain to filter transactions from.
        from_address (Optional[str]): Sender address to filter by.
        to_address (Optional[str]): Recipient address to filter by.
        start_date (Optional[datetime]): Filter transactions from this date.
        end_date (Optional[datetime]): Filter transactions until this date.
        start_block (Optional[int]): Filter transactions from this block number.
        end_block (Optional[int]): Filter transactions until this block number.
        method (Optional[str]): Method signature to filter transactions by.
        escrow (Optional[str]): Escrow address to filter transactions by.
        token (Optional[str]): Token address to filter transactions by.
        first (int): Number of items per page (max 1000).
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.
    """

    def __init__(
        self,
        chain_id: ChainId,
        from_address: Optional[str] = None,
        to_address: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        start_block: Optional[int] = None,
        end_block: Optional[int] = None,
        method: Optional[str] = None,
        escrow: Optional[str] = None,
        token: Optional[str] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Raises:
            ValueError: If addresses are malformed, date/block ranges are invalid,
                or order direction is invalid.
        """

        if from_address and not Web3.is_address(from_address):
            raise ValueError(f"Invalid from_address: {from_address}")

        if to_address and not Web3.is_address(to_address):
            raise ValueError(f"Invalid to_address: {to_address}")

        if escrow and not Web3.is_address(escrow):
            raise ValueError(f"Invalid escrow address: {escrow}")

        if token and not Web3.is_address(token):
            raise ValueError(f"Invalid token address: {token}")

        if start_date and end_date and start_date > end_date:
            raise ValueError(
                f"Invalid date range: start_date must be earlier than end_date"
            )

        if (
            start_block is not None
            and end_block is not None
            and start_block > end_block
        ):
            raise ValueError(
                f"Invalid block range: start_block must be earlier than end_block"
            )

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise ValueError(f"Invalid order: {order_direction}")

        self.chain_id = chain_id
        self.from_address = from_address
        self.to_address = to_address
        self.start_date = start_date
        self.end_date = end_date
        self.start_block = start_block
        self.end_block = end_block
        self.method = method
        self.escrow = escrow
        self.token = token
        self.first = min(first, 1000)
        self.skip = skip
        self.order_direction = order_direction


class StatisticsFilter:
    """Filter configuration for querying statistical data from the subgraph.

    Attributes:
        date_from (Optional[datetime]): Start date for the query range.
        date_to (Optional[datetime]): End date for the query range.
        first (int): Number of items per page (max 1000).
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.

    Example:
        ```python
        from datetime import datetime
        from human_protocol_sdk.filter import StatisticsFilter
        from human_protocol_sdk.constants import OrderDirection

        filter = StatisticsFilter(
            date_from=datetime(2023, 1, 1),
            date_to=datetime(2023, 12, 31),
            first=10,
            skip=0,
            order_direction=OrderDirection.ASC
        )
        ```
    """

    def __init__(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.ASC,
    ):
        """
        Raises:
            FilterError: If date range is invalid or order direction is invalid.
        """

        if date_from and date_to and date_from > date_to:
            raise FilterError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise FilterError(f"Invalid order: {order_direction}")

        self.date_from = date_from
        self.date_to = date_to
        self.first = min(first, 1000)
        self.skip = skip
        self.order_direction = order_direction


class StatusEventFilter:
    """Filter configuration for querying escrow status change events.

    Attributes:
        chain_id (ChainId): Chain where status events were recorded.
        statuses (List[Status]): List of statuses to filter by.
        date_from (Optional[datetime]): Filter events from this date.
        date_to (Optional[datetime]): Filter events until this date.
        launcher (Optional[str]): Launcher address to filter by.
        first (int): Number of items per page.
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.
    """

    def __init__(
        self,
        chain_id: ChainId,
        statuses: Optional[List[Status]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        launcher: Optional[str] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Initializes a filter for status events.

        :param chain_id: The chain ID where the events are recorded.
        :param statuses: Optional list of statuses to filter by.
        :param date_from: Optional start date for filtering.
        :param date_to: Optional end date for filtering.
        :param launcher: Optional launcher address to filter by.
        :param first: Optional number of events per page. Default is 10.
        :param skip: Optional number of events to skip. Default is 0.
        :param order_direction: Optional order direction. Default is DESC.
        """
        self.chain_id = chain_id
        self.statuses = statuses or [
            Status.Launched,
            Status.Pending,
            Status.Partial,
            Status.Paid,
            Status.Complete,
            Status.Cancelled,
        ]
        self.date_from = date_from
        self.date_to = date_to
        self.launcher = launcher
        self.first = first
        self.skip = skip
        self.order_direction = order_direction


class WorkerFilter:
    """Filter configuration for querying worker data from the subgraph.

    Attributes:
        chain_id (ChainId): Chain to request worker data from.
        worker_address (Optional[str]): Worker address to filter by.
        order_by (Optional[str]): Property to order results by (e.g., "payoutCount").
        order_direction (OrderDirection): Sort order for results.
        first (int): Number of items per page (1-1000).
        skip (int): Number of items to skip for pagination.
    """

    def __init__(
        self,
        chain_id: ChainId,
        worker_address: Optional[str] = None,
        order_by: Optional[str] = "payoutCount",
        order_direction: OrderDirection = OrderDirection.DESC,
        first: int = 10,
        skip: int = 0,
    ):
        """
        Raises:
            FilterError: If order direction is invalid.
        """

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise FilterError("Invalid order direction")

        self.chain_id = chain_id
        self.worker_address = worker_address
        self.order_by = order_by
        self.order_direction = order_direction
        self.first = min(max(first, 1), 1000)
        self.skip = max(skip, 0)


class StakersFilter:
    """Filter configuration for querying staker data from the subgraph.

    Attributes:
        chain_id (ChainId): Chain to request staker data from.
        min_staked_amount (Optional[str]): Minimum staked amount to filter by.
        max_staked_amount (Optional[str]): Maximum staked amount to filter by.
        min_locked_amount (Optional[str]): Minimum locked amount to filter by.
        max_locked_amount (Optional[str]): Maximum locked amount to filter by.
        min_withdrawn_amount (Optional[str]): Minimum withdrawn amount to filter by.
        max_withdrawn_amount (Optional[str]): Maximum withdrawn amount to filter by.
        min_slashed_amount (Optional[str]): Minimum slashed amount to filter by.
        max_slashed_amount (Optional[str]): Maximum slashed amount to filter by.
        order_by (Optional[str]): Property to order results by (e.g., "lastDepositTimestamp").
        order_direction (OrderDirection): Sort order for results.
        first (Optional[int]): Number of items per page.
        skip (Optional[int]): Number of items to skip for pagination.
    """

    def __init__(
        self,
        chain_id: ChainId,
        min_staked_amount: Optional[str] = None,
        max_staked_amount: Optional[str] = None,
        min_locked_amount: Optional[str] = None,
        max_locked_amount: Optional[str] = None,
        min_withdrawn_amount: Optional[str] = None,
        max_withdrawn_amount: Optional[str] = None,
        min_slashed_amount: Optional[str] = None,
        max_slashed_amount: Optional[str] = None,
        order_by: Optional[str] = "lastDepositTimestamp",
        order_direction: OrderDirection = OrderDirection.DESC,
        first: Optional[int] = 10,
        skip: Optional[int] = 0,
    ):
        self.chain_id = chain_id
        self.min_staked_amount = min_staked_amount
        self.max_staked_amount = max_staked_amount
        self.min_locked_amount = min_locked_amount
        self.max_locked_amount = max_locked_amount
        self.min_withdrawn_amount = min_withdrawn_amount
        self.max_withdrawn_amount = max_withdrawn_amount
        self.min_slashed_amount = min_slashed_amount
        self.max_slashed_amount = max_slashed_amount
        self.order_by = order_by
        self.order_direction = order_direction
        self.first = first
        self.skip = skip


class CancellationRefundFilter:
    """Filter configuration for querying cancellation refund events.

    Attributes:
        chain_id (ChainId): Chain to request refund data from.
        escrow_address (Optional[str]): Escrow address to filter by.
        receiver (Optional[str]): Receiver address to filter by.
        date_from (Optional[datetime]): Filter refunds from this date.
        date_to (Optional[datetime]): Filter refunds until this date.
        first (int): Number of items per page.
        skip (int): Number of items to skip for pagination.
        order_direction (OrderDirection): Sort order for results.
    """

    def __init__(
        self,
        chain_id: ChainId,
        escrow_address: str = None,
        receiver: str = None,
        date_from: datetime = None,
        date_to: datetime = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Raises:
            FilterError: If chain ID is invalid, addresses are malformed,
                or date range is invalid.
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise FilterError(f"Invalid ChainId")
        if escrow_address and not Web3.is_address(escrow_address):
            raise FilterError(f"Invalid escrow address: {escrow_address}")
        if receiver and not Web3.is_address(receiver):
            raise FilterError(f"Invalid receiver address: {receiver}")
        if date_from and date_to and date_from > date_to:
            raise FilterError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )
        self.chain_id = chain_id
        self.escrow_address = escrow_address
        self.receiver = receiver
        self.date_from = date_from
        self.date_to = date_to
        self.first = first
        self.skip = skip
        self.order_direction = order_direction
