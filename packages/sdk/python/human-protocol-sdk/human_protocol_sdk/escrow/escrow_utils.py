"""
Utility class for escrow-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowUtils, EscrowFilter, Status

    print(
        EscrowUtils.get_escrows(
            EscrowFilter(
                networks=[ChainId.POLYGON_AMOY],
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

Module
------
"""

from datetime import datetime
import logging
import os
from typing import Dict, List, Optional

from web3 import Web3

from human_protocol_sdk.constants import NETWORKS, ChainId, Status, OrderDirection
from human_protocol_sdk.filter import EscrowFilter, StatusEventFilter, PayoutFilter
from human_protocol_sdk.utils import (
    get_data_from_subgraph,
)

from human_protocol_sdk.escrow.escrow_client import EscrowClientError

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowData:
    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_paid: int,
        balance: int,
        count: int,
        factory_address: str,
        launcher: str,
        status: str,
        token: str,
        total_funded_amount: int,
        created_at: datetime,
        final_results_url: Optional[str] = None,
        intermediate_results_url: Optional[str] = None,
        manifest_hash: Optional[str] = None,
        manifest_url: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
    ):
        """
        Initializes an EscrowData instance.

        :param chain_id: Chain identifier
        :param id: Identifier
        :param address: Address
        :param amount_paid: Amount paid
        :param balance: Balance
        :param count: Count
        :param factory_address: Factory address
        :param launcher: Launcher
        :param status: Status
        :param token: Token
        :param total_funded_amount: Total funded amount
        :param created_at: Creation date
        :param final_results_url: URL for final results.
        :param intermediate_results_url: URL for intermediate results.
        :param manifest_hash: Manifest hash.
        :param manifest_url: Manifest URL.
        :param recording_oracle: Recording Oracle address.
        :param reputation_oracle: Reputation Oracle address.
        :param exchange_oracle: Exchange Oracle address.
        """

        self.id = id
        self.address = address
        self.amount_paid = amount_paid
        self.balance = balance
        self.count = count
        self.factory_address = factory_address
        self.final_results_url = final_results_url
        self.intermediate_results_url = intermediate_results_url
        self.launcher = launcher
        self.manifest_hash = manifest_hash
        self.manifest_url = manifest_url
        self.recording_oracle = recording_oracle
        self.reputation_oracle = reputation_oracle
        self.exchange_oracle = exchange_oracle
        self.status = status
        self.token = token
        self.total_funded_amount = total_funded_amount
        self.created_at = created_at
        self.chain_id = chain_id


class StatusEvent:
    """
    Initializes a StatusEvent instance.

    :param timestamp: The timestamp of the event.
    :param status: The status of the escrow.
    :param chain_id: The chain identifier where the event occurred.
    :param escrow_address: The address of the escrow.
    """

    def __init__(
        self, timestamp: int, status: str, chain_id: ChainId, escrow_address: str
    ):
        self.timestamp = timestamp
        self.status = status
        self.chain_id = chain_id
        self.escrow_address = escrow_address


class Payout:
    """
    Initializes a Payout instance.

    :param id: The id of the payout.
    :param chain_id: The chain identifier where the payout occurred.
    :param escrow_address: The address of the escrow that executed the payout.
    :param recipient: The address of the recipient.
    :param amount: The amount of the payout.
    :param created_at: The time of creation of the payout.
    """

    def __init__(
        self, id: str, escrow_address: str, recipient: str, amount: int, created_at: int
    ):
        self.id = id
        self.escrow_address = escrow_address
        self.recipient = recipient
        self.amount = amount
        self.created_at = created_at


class EscrowUtils:
    """
    A utility class that provides additional escrow-related functionalities.
    """

    @staticmethod
    def get_escrows(
        filter: EscrowFilter,
    ) -> List[EscrowData]:
        """Get an array of escrow addresses based on the specified filter parameters.

        :param filter: Object containing all the necessary parameters to filter

        :return: List of escrows

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.escrow import EscrowUtils, EscrowFilter, Status

                print(
                    EscrowUtils.get_escrows(
                        EscrowFilter(
                            networks=[ChainId.POLYGON_AMOY],
                            status=Status.Pending,
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.escrow import get_escrows_query

        chain_id = filter.chain_id
        network = NETWORKS[chain_id]

        escrows = []

        statuses = None
        if filter.status:
            if isinstance(filter.status, list):
                statuses = [s.name for s in filter.status]
            else:
                statuses = [filter.status.name]

        escrows_data = get_data_from_subgraph(
            network,
            query=get_escrows_query(filter),
            params={
                "launcher": filter.launcher.lower() if filter.launcher else None,
                "reputationOracle": (
                    filter.reputation_oracle.lower()
                    if filter.reputation_oracle
                    else None
                ),
                "recordingOracle": (
                    filter.recording_oracle.lower() if filter.recording_oracle else None
                ),
                "exchangeOracle": (
                    filter.exchange_oracle.lower() if filter.exchange_oracle else None
                ),
                "jobRequesterId": filter.job_requester_id,
                "status": statuses,
                "from": (
                    int(filter.date_from.timestamp()) if filter.date_from else None
                ),
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )

        if (
            not escrows_data
            or "data" not in escrows_data
            or "escrows" not in escrows_data["data"]
            or not escrows_data["data"]["escrows"]
        ):
            return []

        escrows_raw = escrows_data["data"]["escrows"]

        escrows.extend(
            [
                EscrowData(
                    chain_id=chain_id,
                    id=escrow.get("id", ""),
                    address=escrow.get("address", ""),
                    amount_paid=int(escrow.get("amountPaid", 0)),
                    balance=int(escrow.get("balance", 0)),
                    count=int(escrow.get("count", 0)),
                    factory_address=escrow.get("factoryAddress", ""),
                    launcher=escrow.get("launcher", ""),
                    status=escrow.get("status", ""),
                    token=escrow.get("token", ""),
                    total_funded_amount=int(escrow.get("totalFundedAmount", 0)),
                    created_at=datetime.fromtimestamp(int(escrow.get("createdAt", 0))),
                    final_results_url=escrow.get("finalResultsUrl", None),
                    intermediate_results_url=escrow.get("intermediateResultsUrl", None),
                    manifest_hash=escrow.get("manifestHash", None),
                    manifest_url=escrow.get("manifestUrl", None),
                    recording_oracle=escrow.get("recordingOracle", None),
                    reputation_oracle=escrow.get("reputationOracle", None),
                    exchange_oracle=escrow.get("exchangeOracle", None),
                )
                for escrow in escrows_raw
            ]
        )

        return escrows

    @staticmethod
    def get_escrow(
        chain_id: ChainId,
        escrow_address: str,
    ) -> Optional[EscrowData]:
        """Returns the escrow for a given address.

        :param chain_id: Network in which the escrow has been deployed
        :param escrow_address: Address of the escrow

        :return: Escrow data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.escrow import EscrowUtils

                print(
                    EscrowUtils.get_escrow(
                        ChainId.POLYGON_AMOY,
                        "0x1234567890123456789012345678901234567890"
                    )
                )
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrow_query,
        )

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise EscrowClientError(f"Invalid ChainId")

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        network = NETWORKS[ChainId(chain_id)]

        escrow_data = get_data_from_subgraph(
            network,
            query=get_escrow_query(),
            params={
                "escrowAddress": escrow_address.lower(),
            },
        )

        if (
            not escrow_data
            or "data" not in escrow_data
            or "escrow" not in escrow_data["data"]
            or not escrow_data["data"]["escrow"]
        ):
            return None

        escrow = escrow_data["data"]["escrow"]

        return EscrowData(
            chain_id=chain_id,
            id=escrow.get("id", ""),
            address=escrow.get("address", ""),
            amount_paid=int(escrow.get("amountPaid", 0)),
            balance=int(escrow.get("balance", 0)),
            count=int(escrow.get("count", 0)),
            factory_address=escrow.get("factoryAddress", ""),
            launcher=escrow.get("launcher", ""),
            status=escrow.get("status", ""),
            token=escrow.get("token", ""),
            total_funded_amount=int(escrow.get("totalFundedAmount", 0)),
            created_at=datetime.fromtimestamp(int(escrow.get("createdAt", 0))),
            final_results_url=escrow.get("finalResultsUrl", None),
            intermediate_results_url=escrow.get("intermediateResultsUrl", None),
            manifest_hash=escrow.get("manifestHash", None),
            manifest_url=escrow.get("manifestUrl", None),
            recording_oracle=escrow.get("recordingOracle", None),
            reputation_oracle=escrow.get("reputationOracle", None),
            exchange_oracle=escrow.get("exchangeOracle", None),
        )

    @staticmethod
    def get_status_events(filter: StatusEventFilter) -> List[StatusEvent]:
        """
        Retrieve status events for specified networks and statuses within a date range.

        :param filter: Object containing all the necessary parameters to filter status events.

        :return List[StatusEvent]: List of status events matching the query parameters.

        :raise EscrowClientError: If an unsupported chain ID or invalid launcher address is provided.
        """
        from human_protocol_sdk.gql.escrow import get_status_query

        if filter.launcher and not Web3.is_address(filter.launcher):
            raise EscrowClientError("Invalid Address")

        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        status_names = [status.name for status in filter.statuses]

        data = get_data_from_subgraph(
            network,
            get_status_query(filter.date_from, filter.date_to, filter.launcher),
            {
                "status": status_names,
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "launcher": filter.launcher.lower() if filter.launcher else None,
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )

        if (
            not data
            or "data" not in data
            or "escrowStatusEvents" not in data["data"]
            or not data["data"]["escrowStatusEvents"]
        ):
            return []

        status_events = data["data"]["escrowStatusEvents"]

        events_with_chain_id = [
            StatusEvent(
                timestamp=event["timestamp"],
                escrow_address=event["escrowAddress"],
                status=event["status"],
                chain_id=filter.chain_id,
            )
            for event in status_events
        ]

        return events_with_chain_id

    @staticmethod
    def get_payouts(filter: PayoutFilter) -> List[Payout]:
        """
        Fetch payouts from the subgraph based on the provided filter.

        :param filter: Object containing all the necessary parameters to filter payouts.

        :return List[Payout]: List of payouts matching the query parameters.

        :raise EscrowClientError: If an unsupported chain ID or invalid addresses are provided.
        """
        from human_protocol_sdk.gql.payout import get_payouts_query

        if filter.escrow_address and not Web3.is_address(filter.escrow_address):
            raise EscrowClientError("Invalid escrow address")

        if filter.recipient and not Web3.is_address(filter.recipient):
            raise EscrowClientError("Invalid recipient address")

        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        data = get_data_from_subgraph(
            network,
            get_payouts_query(filter),
            {
                "escrowAddress": (
                    filter.escrow_address.lower() if filter.escrow_address else None
                ),
                "recipient": filter.recipient.lower() if filter.recipient else None,
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": min(filter.first, 1000),
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )

        if (
            not data
            or "data" not in data
            or "payouts" not in data["data"]
            or not data["data"]["payouts"]
        ):
            return []

        payouts_raw = data["data"]["payouts"]

        payouts = [
            Payout(
                id=payout["id"],
                escrow_address=payout["escrowAddress"],
                recipient=payout["recipient"],
                amount=int(payout["amount"]),
                created_at=int(payout["createdAt"]),
            )
            for payout in payouts_raw
        ]

        return payouts
