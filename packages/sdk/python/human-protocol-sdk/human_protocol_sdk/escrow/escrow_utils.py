"""Utility helpers for escrow-related queries.

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
    """Represents escrow data retrieved from the subgraph.

    Attributes:
        id (str): Unique escrow identifier.
        address (str): Escrow contract address.
        amount_paid (int): Total amount paid out.
        balance (int): Remaining balance in the escrow.
        count (int): Number of payouts executed.
        factory_address (str): Address of the factory that created this escrow.
        final_results_url (Optional[str]): URL for final results file.
        final_results_hash (Optional[str]): Hash of final results file.
        intermediate_results_url (Optional[str]): URL for intermediate results file.
        intermediate_results_hash (Optional[str]): Hash of intermediate results file.
        launcher (str): Address of the job launcher.
        job_requester_id (Optional[str]): Off-chain job requester identifier.
        manifest_hash (Optional[str]): Hash of the manifest file.
        manifest (Optional[str]): Manifest data (URL or JSON string).
        recording_oracle (Optional[str]): Address of the recording oracle.
        reputation_oracle (Optional[str]): Address of the reputation oracle.
        exchange_oracle (Optional[str]): Address of the exchange oracle.
        recording_oracle_fee (Optional[int]): Recording oracle fee percentage.
        reputation_oracle_fee (Optional[int]): Reputation oracle fee percentage.
        exchange_oracle_fee (Optional[int]): Exchange oracle fee percentage.
        status (str): Current escrow status.
        token (str): Address of the payment token.
        total_funded_amount (int): Total amount funded to the escrow.
        created_at (int): Creation timestamp in milliseconds.
        chain_id (ChainId): Chain where the escrow is deployed.
    """

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
    """Represents an escrow status change event.

    Attributes:
        timestamp (int): Event timestamp in milliseconds.
        status (str): The new status of the escrow.
        chain_id (ChainId): Chain where the event occurred.
        escrow_address (str): Address of the escrow that changed status.
    """

    def __init__(
        self, timestamp: int, status: str, chain_id: ChainId, escrow_address: str
    ):
        self.timestamp = timestamp * 1000
        self.status = status
        self.chain_id = chain_id
        self.escrow_address = escrow_address


class Payout:
    """Represents a payout distributed by an escrow.

    Attributes:
        id (str): Unique payout identifier.
        escrow_address (str): Address of the escrow that executed the payout.
        recipient (str): Address of the payout recipient.
        amount (int): Amount paid in token's smallest unit.
        created_at (int): Payout creation timestamp in milliseconds.
    """

    def __init__(
        self, id: str, escrow_address: str, recipient: str, amount: str, created_at: str
    ):
        self.id = id
        self.escrow_address = escrow_address
        self.recipient = recipient
        self.amount = int(amount)
        self.created_at = int(created_at) * 1000


class CancellationRefund:
    """Represents a cancellation refund event.

    Attributes:
        id (str): Unique refund identifier.
        escrow_address (str): Address of the escrow associated with the refund.
        receiver (str): Address receiving the refund.
        amount (int): Refunded amount in token's smallest unit.
        block (int): Block number where the refund was processed.
        timestamp (int): Refund timestamp in milliseconds.
        tx_hash (str): Transaction hash of the refund.
    """

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
        self.id = id
        self.escrow_address = escrow_address
        self.receiver = receiver
        self.amount = int(amount)
        self.block = int(block)
        self.timestamp = int(timestamp) * 1000
        self.tx_hash = tx_hash


class EscrowUtils:
    """Utility class providing escrow-related query and data retrieval functions.

    This class offers static methods to fetch escrow data, status events, payouts,
    and cancellation refunds from the Human Protocol subgraph.
    """

    @staticmethod
    def get_escrows(
        filter: EscrowFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[EscrowData]:
        """Retrieve a list of escrows matching the provided filter criteria.

        Queries the subgraph for escrow contracts that match the specified parameters
        including status, date range, and oracle addresses.

        Args:
            filter (EscrowFilter): Filter parameters including chain ID, status, date range,
                and oracle addresses.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests
                such as custom endpoints or timeout settings.

        Returns:
            A list of escrow records matching the filter criteria.
                Returns an empty list if no matches are found.

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
        """Fetch a single escrow by its address.

        Retrieves detailed information about a specific escrow contract from the subgraph.

        Args:
            chain_id (ChainId): Network where the escrow has been deployed.
            escrow_address (str): Address of the escrow contract.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Escrow data if found, otherwise ``None``.

        Raises:
            EscrowClientError: If the chain ID is invalid or the escrow address is malformed.

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
        """Retrieve status change events for escrows.

        Queries the subgraph for escrow status change events within the specified
        date range and matching the provided statuses.

        Args:
            filter (StatusEventFilter): Filter parameters including chain ID, statuses,
                date range, and oracle addresses.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of status change events matching the filter criteria.
                Returns an empty list if no matches are found.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid launcher address is provided.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId, Status
            from human_protocol_sdk.escrow import EscrowUtils
            from human_protocol_sdk.filter import StatusEventFilter
            import datetime

            events = EscrowUtils.get_status_events(
                StatusEventFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    statuses=[Status.Pending, Status.Completed],
                    date_from=datetime.datetime(2023, 5, 8),
                    date_to=datetime.datetime(2023, 6, 8),
                )
            )
            ```
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
        """Fetch payout records from the subgraph.

        Retrieves payout transactions for escrows based on the provided filter criteria
        including escrow address, recipient, and date range.

        Args:
            filter (PayoutFilter): Filter parameters including chain ID, escrow address,
                recipient address, date range, pagination, and sorting options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of payout records matching the query parameters.
                Returns an empty list if no matches are found.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid addresses are provided.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.escrow import EscrowUtils
            from human_protocol_sdk.filter import PayoutFilter

            payouts = EscrowUtils.get_payouts(
                PayoutFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    escrow_address="0x1234567890123456789012345678901234567890",
                )
            )
            ```
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
        """Fetch cancellation refund events from the subgraph.

        Retrieves cancellation refund transactions for escrows based on the provided
        filter criteria including escrow address, receiver, and date range.

        Args:
            filter (CancellationRefundFilter): Filter parameters including chain ID,
                escrow address, receiver address, date range, pagination, and sorting options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of cancellation refunds matching the query parameters.
                Returns an empty list if no matches are found.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid addresses are provided.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.escrow import EscrowUtils
            from human_protocol_sdk.filter import CancellationRefundFilter

            refunds = EscrowUtils.get_cancellation_refunds(
                CancellationRefundFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    escrow_address="0x1234567890123456789012345678901234567890",
                )
            )
            ```
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
        """Retrieve the cancellation refund for a specific escrow.

        Fetches the cancellation refund event associated with a given escrow address.
        Each escrow can have at most one cancellation refund.

        Args:
            chain_id (ChainId): Network where the escrow has been deployed.
            escrow_address (str): Address of the escrow contract.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Cancellation refund data if found, otherwise ``None``.

        Raises:
            EscrowClientError: If an unsupported chain ID or invalid escrow address is provided.

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
