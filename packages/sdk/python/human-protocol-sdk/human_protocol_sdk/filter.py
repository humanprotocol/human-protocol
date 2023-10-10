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
        networks: [List[ChainId]],
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

        Args:
            networks (List[ChainId]): Networks to request data
            launcher (Optional[str]): Launcher address
            reputation_oracle (Optional[str]): Reputation oracle address
            recording_oracle (Optional[str]): Recording oracle address
            exchange_oracle (Optional[str]): Exchange oracle address
            job_requester_id (Optional[str]): Job requester id
            status (Optional[Status]): Escrow status
            date_from (Optional[datetime]): Created from date
            date_to (Optional[datetime]): Created to date
        """

        if not networks or any(
            network not in set(chain_id.value for chain_id in ChainId)
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

        Args:
            escrow_address (Optional[str]): Escrow address
            recipient (Optional[str]): Recipient address
            date_from (Optional[datetime]): Created from date
            date_to (Optional[datetime]): Created to date
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
