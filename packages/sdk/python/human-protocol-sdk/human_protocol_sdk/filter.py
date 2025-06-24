#!/usr/bin/env python3

from datetime import datetime

from typing import List, Optional

from human_protocol_sdk.constants import ChainId, Status, OrderDirection

from web3 import Web3


class FilterError(Exception):
    """
    Raises when some error happens when building filter object.
    """

    pass


class EscrowFilter:
    """
    A class used to filter escrow requests.
    """

    def __init__(
        self,
        chain_id: ChainId,
        launcher: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
        job_requester_id: Optional[str] = None,
        status: Optional[Status] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.DESC,
    ):
        """
        Initializes a EscrowFilter instance.

        :param chain_id: Network to request data
        :param launcher: Launcher address
        :param reputation_oracle: Reputation oracle address
        :param recording_oracle: Recording oracle address
        :param exchange_oracle: Exchange oracle address
        :param job_requester_id: Job requester id
        :param status: Escrow status
        :param date_from: Created from date
        :param date_to: Created to date
        :param first: Number of items per page
        :param skip: Page number to retrieve
        :param order_direction: Order of results, "asc" or "desc"
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
    """
    A class used to filter payout requests.
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
        Initializes a filter for payouts.

        :param chain_id: The chain ID where the payouts are recorded.
        :param escrow_address: Optional escrow address to filter payouts.
        :param recipient: Optional recipient address to filter payouts.
        :param date_from: Optional start date for filtering.
        :param date_to: Optional end date for filtering.
        :param first: Optional number of payouts per page. Default is 10.
        :param skip: Optional number of payouts to skip. Default is 0.
        :param order_direction: Optional order direction. Default is DESC.
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
    """
    A class used to filter transactions.
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
        Initializes a TransactionsFilter instance.

        :param chain_id: Chain ID to filter transactions from
        :param from_address: Sender address
        :param to_address: Receiver address
        :param start_date: Start date for filtering transactions
        :param end_date: End date for filtering transactions
        :param start_block: Start block number for filtering transactions
        :param end_block: End block number for filtering transactions
        :param method: Method name to filter transactions
        :param escrow: Escrow address to filter transactions
        :param token: Token address to filter transactions
        :param first: Number of items per page
        :param skip: Page number to retrieve
        :param order: Order of results, "asc" or "desc"

        :raises ValueError: If start_date is after end_date
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
    """
    A class used to filter statistical data.

    :param date_from: Start date for the query range.
    :param date_to: End date for the query range.
    :param first: Number of items per page.
    :param skip: Page number to retrieve.
    :param order_direction: Order of results, "asc" or "desc".

    :example:
        .. code-block:: python

            from datetime import datetime
            from human_protocol_sdk.filter import StatisticsFilter

            filter = StatisticsFilter(
                date_from=datetime(2023, 1, 1),
                date_to=datetime(2023, 12, 31),
                first=10,
                skip=0,
                order_direction=OrderDirection.ASC
            )
    """

    def __init__(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        first: int = 10,
        skip: int = 0,
        order_direction: OrderDirection = OrderDirection.ASC,
    ):
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
    """
    A class used to filter workers.
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
        Initializes a WorkerFilter instance.

        :param chain_id: Chain ID to request data
        :param worker_address: Address to filter by
        :param order_by: Property to order by, e.g., "payoutCount"
        :param order_direction: Order direction of results, "asc" or "desc"
        :param first: Number of items per page
        :param skip: Number of items to skip (for pagination)
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
