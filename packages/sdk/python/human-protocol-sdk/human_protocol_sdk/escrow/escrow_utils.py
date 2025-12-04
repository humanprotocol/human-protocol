"""Utility helpers for escrow-related operations.

Example:
    ```python
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
    ```
"""

import logging
from typing import List, Optional

from web3 import Web3

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.filter import (
    CancellationRefundFilter,
    EscrowFilter,
    StatusEventFilter,
    PayoutFilter,
)
from human_protocol_sdk.utils import (
    SubgraphOptions,
    custom_gql_fetch,
)

from human_protocol_sdk.escrow.escrow_client import EscrowClientError

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowData:
    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_paid: str,
        balance: str,
        count: str,
        factory_address: str,
        launcher: str,
        job_requester_id: Optional[str],
        status: str,
        token: str,
        total_funded_amount: str,
        created_at: str,
        final_results_url: Optional[str] = None,
        final_results_hash: Optional[str] = None,
        intermediate_results_url: Optional[str] = None,
        intermediate_results_hash: Optional[str] = None,
        manifest_hash: Optional[str] = None,
        manifest: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
        recording_oracle_fee: Optional[str] = None,
        reputation_oracle_fee: Optional[str] = None,
        exchange_oracle_fee: Optional[str] = None,
    ):
        """Represents escrow data returned from the subgraph.

        Args:
            chain_id: Chain identifier.
            id: Escrow identifier.
            address: Escrow address.
            amount_paid: Amount paid.
            balance: Remaining balance.
            count: Number of payouts.
            factory_address: Factory address.
            launcher: Job launcher address.
            job_requester_id: Job requester identifier.
            status: Escrow status.
            token: Payment token address.
            total_funded_amount: Total funded amount.
            created_at: Creation timestamp in milliseconds.
            final_results_url: URL for final results.
            final_results_hash: Hash for final results.
            intermediate_results_url: URL for intermediate results.
            intermediate_results_hash: Hash for intermediate results.
            manifest_hash: Manifest hash.
            manifest: Manifest data (JSON/URL).
            recording_oracle: Recording Oracle address.
            reputation_oracle: Reputation Oracle address.
            exchange_oracle: Exchange Oracle address.
            recording_oracle_fee: Fee for the Recording Oracle.
            reputation_oracle_fee: Fee for the Reputation Oracle.
            exchange_oracle_fee: Fee for the Exchange Oracle.
        """

        self.id = id
        self.address = address
        self.amount_paid = int(amount_paid)
        self.balance = int(balance)
        self.count = int(count)
        self.factory_address = factory_address
        self.final_results_url = final_results_url
        self.final_results_hash = final_results_hash
        self.intermediate_results_url = intermediate_results_url
        self.intermediate_results_hash = intermediate_results_hash
        self.launcher = launcher
        self.job_requester_id = job_requester_id
        self.manifest_hash = manifest_hash
        self.manifest = manifest
        self.recording_oracle = recording_oracle
        self.reputation_oracle = reputation_oracle
        self.exchange_oracle = exchange_oracle
        self.recording_oracle_fee = (
            int(recording_oracle_fee) if recording_oracle_fee is not None else None
        )
        self.reputation_oracle_fee = (
            int(reputation_oracle_fee) if reputation_oracle_fee is not None else None
        )
        self.exchange_oracle_fee = (
            int(exchange_oracle_fee) if exchange_oracle_fee is not None else None
        )
        self.status = status
        self.token = token
        self.total_funded_amount = int(total_funded_amount)
        self.created_at = int(created_at) * 1000
        self.chain_id = chain_id


class StatusEvent:
    """Represents an escrow status change event."""

    def __init__(
        self, timestamp: int, status: str, chain_id: ChainId, escrow_address: str
    ):
        """Create a status event.

        Args:
            timestamp: Event timestamp in seconds (converted to ms internally).
            status: Escrow status.
            chain_id: Chain where the event occurred.
            escrow_address: Address of the escrow.
        """
        self.timestamp = timestamp * 1000
        self.status = status
        self.chain_id = chain_id
        self.escrow_address = escrow_address


class Payout:
    """Represents a payout distributed by an escrow."""

    def __init__(
        self, id: str, escrow_address: str, recipient: str, amount: str, created_at: str
    ):
        """Create a payout record.

        Args:
            id: Payout ID.
            escrow_address: Escrow that executed the payout.
            recipient: Recipient address.
            amount: Amount paid.
            created_at: Creation time in seconds (converted to ms internally).
        """
        self.id = id
        self.escrow_address = escrow_address
        self.recipient = recipient
        self.amount = int(amount)
        self.created_at = int(created_at) * 1000


class CancellationRefund:
    """Represents a cancellation refund event."""

    def __init__(
        self,
        id: str,
        escrow_address: str,
        receiver: str,
        amount: str,
        block: str,
        timestamp: str,
        tx_hash: str,
    ):
        """Create a cancellation refund record.

        Args:
            id: Refund ID.
            escrow_address: Escrow associated with the refund.
            receiver: Address receiving the refund.
            amount: Refunded amount.
            block: Block number where the refund was processed.
            timestamp: Refund timestamp in seconds (converted to ms internally).
            tx_hash: Transaction hash of the refund.
        """
        self.id = id
        self.escrow_address = escrow_address
        self.receiver = receiver
        self.amount = int(amount)
        self.block = int(block)
        self.timestamp = int(timestamp) * 1000
        self.tx_hash = tx_hash


class EscrowUtils:
    """
    A utility class that provides additional escrow-related functionalities.
    """

    @staticmethod
    def get_escrows(
        filter: EscrowFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[EscrowData]:
        """List escrows that match the provided filter.

        Args:
            filter: Parameters used to filter escrows.
            options: Optional config for subgraph requests.

        Returns:
            A list of escrow records.

        Example:
            ```python
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
            ```
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

        escrows_data = custom_gql_fetch(
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
            options=options,
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
                    id=escrow.get("id"),
                    address=escrow.get("address"),
                    amount_paid=escrow.get("amountPaid"),
                    balance=escrow.get("balance"),
                    count=escrow.get("count"),
                    factory_address=escrow.get("factoryAddress"),
                    launcher=escrow.get("launcher"),
                    job_requester_id=escrow.get("jobRequesterId"),
                    status=escrow.get("status"),
                    token=escrow.get("token"),
                    total_funded_amount=escrow.get("totalFundedAmount"),
                    created_at=escrow.get("createdAt"),
                    final_results_url=escrow.get("finalResultsUrl"),
                    final_results_hash=escrow.get("finalResultsHash"),
                    intermediate_results_url=escrow.get("intermediateResultsUrl"),
                    intermediate_results_hash=escrow.get("intermediateResultsHash"),
                    manifest_hash=escrow.get("manifestHash"),
                    manifest=escrow.get("manifest"),
                    recording_oracle=escrow.get("recordingOracle"),
                    reputation_oracle=escrow.get("reputationOracle"),
                    exchange_oracle=escrow.get("exchangeOracle"),
                    recording_oracle_fee=escrow.get("recordingOracleFee"),
                    reputation_oracle_fee=escrow.get("reputationOracleFee"),
                    exchange_oracle_fee=escrow.get("exchangeOracleFee"),
                )
                for escrow in escrows_raw
            ]
        )

        return escrows

    @staticmethod
    def get_escrow(
        chain_id: ChainId,
        escrow_address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[EscrowData]:
        """Fetch a single escrow by address.

        Args:
            chain_id: Network in which the escrow has been deployed.
            escrow_address: Address of the escrow.
            options: Optional config for subgraph requests.

        Returns:
            Escrow data if found, otherwise ``None``.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.escrow import EscrowUtils

            print(
                EscrowUtils.get_escrow(
                    ChainId.POLYGON_AMOY,
                    "0x1234567890123456789012345678901234567890",
                )
            )
            ```
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrow_query,
        )

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise EscrowClientError(f"Invalid ChainId")

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        network = NETWORKS[ChainId(chain_id)]

        escrow_data = custom_gql_fetch(
            network,
            query=get_escrow_query(),
            params={
                "escrowAddress": escrow_address.lower(),
            },
            options=options,
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
            id=escrow.get("id"),
            address=escrow.get("address"),
            amount_paid=escrow.get("amountPaid"),
            balance=escrow.get("balance"),
            count=escrow.get("count"),
            factory_address=escrow.get("factoryAddress"),
            launcher=escrow.get("launcher"),
            job_requester_id=escrow.get("jobRequesterId"),
            status=escrow.get("status"),
            token=escrow.get("token"),
            total_funded_amount=escrow.get("totalFundedAmount"),
            created_at=escrow.get("createdAt"),
            final_results_url=escrow.get("finalResultsUrl"),
            final_results_hash=escrow.get("finalResultsHash"),
            intermediate_results_url=escrow.get("intermediateResultsUrl"),
            intermediate_results_hash=escrow.get("intermediateResultsHash"),
            manifest_hash=escrow.get("manifestHash"),
            manifest=escrow.get("manifest"),
            recording_oracle=escrow.get("recordingOracle"),
            reputation_oracle=escrow.get("reputationOracle"),
            exchange_oracle=escrow.get("exchangeOracle"),
            recording_oracle_fee=escrow.get("recordingOracleFee"),
            reputation_oracle_fee=escrow.get("reputationOracleFee"),
            exchange_oracle_fee=escrow.get("exchangeOracleFee"),
        )

    @staticmethod
    def get_status_events(
        filter: StatusEventFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[StatusEvent]:
        """Retrieve status events for specified networks and statuses within a date range.

        Args:
            filter: Parameters used to filter status events.
            options: Optional config for subgraph requests.

        Returns:
            A list of matching status events.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid launcher address is provided.
        """
        from human_protocol_sdk.gql.escrow import get_status_query

        if filter.launcher and not Web3.is_address(filter.launcher):
            raise EscrowClientError("Invalid Address")

        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        status_names = [status.name for status in filter.statuses]

        data = custom_gql_fetch(
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
            options=options,
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
                timestamp=int(event["timestamp"]),
                escrow_address=event["escrowAddress"],
                status=event["status"],
                chain_id=filter.chain_id,
            )
            for event in status_events
        ]

        return events_with_chain_id

    @staticmethod
    def get_payouts(
        filter: PayoutFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[Payout]:
        """Fetch payouts from the subgraph based on the provided filter.

        Args:
            filter: Parameters used to filter payouts.
            options: Optional config for subgraph requests.

        Returns:
            A list of payouts matching the query parameters.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid addresses are provided.
        """
        from human_protocol_sdk.gql.payout import get_payouts_query

        if filter.escrow_address and not Web3.is_address(filter.escrow_address):
            raise EscrowClientError("Invalid escrow address")

        if filter.recipient and not Web3.is_address(filter.recipient):
            raise EscrowClientError("Invalid recipient address")

        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        data = custom_gql_fetch(
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
            options=options,
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
                amount=payout["amount"],
                created_at=payout["createdAt"],
            )
            for payout in payouts_raw
        ]

        return payouts

    @staticmethod
    def get_cancellation_refunds(
        filter: CancellationRefundFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[CancellationRefund]:
        """Fetch cancellation refunds from the subgraph based on the provided filter.

        Args:
            filter: Parameters used to filter cancellation refunds.
            options: Optional config for subgraph requests.

        Returns:
            A list of cancellation refunds matching the query parameters.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid addresses are provided.
        """
        from human_protocol_sdk.gql.cancel import get_cancellation_refunds_query

        if filter.escrow_address and not Web3.is_address(filter.escrow_address):
            raise EscrowClientError("Invalid escrow address")

        if filter.receiver and not Web3.is_address(filter.receiver):
            raise EscrowClientError("Invalid receiver address")

        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        data = custom_gql_fetch(
            network,
            get_cancellation_refunds_query(filter),
            {
                "escrowAddress": (
                    filter.escrow_address.lower() if filter.escrow_address else None
                ),
                "receiver": filter.receiver.lower() if filter.receiver else None,
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                "first": min(filter.first, 1000),
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
        )

        if (
            not data
            or "data" not in data
            or "cancellationRefundEvents" not in data["data"]
            or not data["data"]["cancellationRefundEvents"]
        ):
            return []

        refunds_raw = data["data"]["cancellationRefundEvents"]

        refunds = [
            CancellationRefund(
                id=refund["id"],
                escrow_address=refund["escrowAddress"],
                receiver=refund["receiver"],
                amount=refund["amount"],
                block=refund["block"],
                timestamp=refund["timestamp"],
                tx_hash=refund["txHash"],
            )
            for refund in refunds_raw
        ]

        return refunds

    @staticmethod
    def get_cancellation_refund(
        chain_id: ChainId,
        escrow_address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> CancellationRefund:
        """Return the cancellation refund for a given escrow address.

        Args:
            chain_id: Network in which the escrow has been deployed.
            escrow_address: Address of the escrow.
            options: Optional config for subgraph requests.

        Returns:
            CancellationRefund data or ``None``.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid address is provided.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.escrow import EscrowUtils

            refund = EscrowUtils.get_cancellation_refund(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )
            ```
        """
        from human_protocol_sdk.gql.cancel import (
            get_cancellation_refund_by_escrow_query,
        )

        if not Web3.is_address(escrow_address):
            raise EscrowClientError("Invalid escrow address")

        network = NETWORKS.get(chain_id)
        if not network:
            raise EscrowClientError("Unsupported Chain ID")

        data = custom_gql_fetch(
            network,
            get_cancellation_refund_by_escrow_query(),
            {
                "escrowAddress": escrow_address.lower(),
            },
            options=options,
        )

        if (
            not data
            or "data" not in data
            or "cancellationRefundEvents" not in data["data"]
            or not data["data"]["cancellationRefundEvents"]
            or len(data["data"]["cancellationRefundEvents"]) == 0
        ):
            return None

        refund = data["data"]["cancellationRefundEvents"][0]

        return CancellationRefund(
            id=refund["id"],
            escrow_address=refund["escrowAddress"],
            receiver=refund["receiver"],
            amount=refund["amount"],
            block=refund["block"],
            timestamp=refund["timestamp"],
            tx_hash=refund["txHash"],
        )
