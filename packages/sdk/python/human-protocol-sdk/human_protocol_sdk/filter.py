#!/usr/bin/env python3

from datetime import datetime

from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId, Status

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
        networks: List[ChainId],
        launcher: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
        job_requester_id: Optional[str] = None,
        status: Optional[Status] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ):
        """
        Initializes a EscrowFilter instance.

        :param networks: Networks to request data
        :param launcher: Launcher address
        :param reputation_oracle: Reputation oracle address
        :param recording_oracle: Recording oracle address
        :param exchange_oracle: Exchange oracle address
        :param job_requester_id: Job requester id
        :param status: Escrow status
        :param date_from: Created from date
        :param date_to: Created to date
        """

        if not networks or any(
            network.value not in set(chain_id.value for chain_id in ChainId)
            for network in networks
        ):
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

        self.launcher = launcher
        self.reputation_oracle = reputation_oracle
        self.recording_oracle = recording_oracle
        self.exchange_oracle = exchange_oracle
        self.job_requester_id = job_requester_id
        self.status = status
        self.date_from = date_from
        self.date_to = date_to
        self.networks = networks


class PayoutFilter:
    """
    A class used to filter payout requests.
    """

    def __init__(
        self,
        escrow_address: Optional[str] = None,
        recipient: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ):
        """
        Initializes a PayoutFilter instance.

        :param escrow_address: Escrow address
        :param recipient: Recipient address
        :param date_from: Created from date
        :param date_to: Created to date
        """

        if escrow_address and not Web3.is_address(escrow_address):
            raise FilterError(f"Invalid address: {escrow_address}")

        if recipient and not Web3.is_address(recipient):
            raise FilterError(f"Invalid address: {recipient}")

        if date_from and date_to and date_from > date_to:
            raise FilterError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        self.escrow_address = escrow_address
        self.recipient = recipient
        self.date_from = date_from
        self.date_to = date_to


class TransactionFilter:
    """
    A class used to filter transactions.
    """

    def __init__(
        self,
        networks: List[ChainId],
        from_address: Optional[str] = None,
        to_address: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        start_block: Optional[int] = None,
        end_block: Optional[int] = None,
    ):
        """
        Initializes a TransactionsFilter instance.

        :param networks: List of chain IDs to filter transactions from
        :param from_address: Sender address
        :param to_address: Receiver address
        :param start_date: Start date for filtering transactions
        :param end_date: End date for filtering transactions
        :param start_block: Start block number for filtering transactions
        :param end_block: End block number for filtering transactions

        :raises ValueError: If start_date is after end_date
        """

        if from_address and not Web3.is_address(from_address):
            raise ValueError(f"Invalid from_address: {from_address}")

        if to_address and not Web3.is_address(to_address):
            raise ValueError(f"Invalid to_address: {to_address}")

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

        if (start_date or end_date) and (start_block or end_block):
            raise ValueError(
                "Date and block filters cannot be used together in TransactionsFilter"
            )

        self.networks = networks
        self.from_address = from_address
        self.to_address = to_address
        self.start_date = start_date
        self.end_date = end_date
        self.start_block = start_block
        self.end_block = end_block
