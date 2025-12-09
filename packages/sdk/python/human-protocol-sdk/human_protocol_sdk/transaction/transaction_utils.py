"""Utility helpers for transaction-related queries.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter

    TransactionUtils.get_transactions(
        TransactionFilter(
            chain_id=ChainId.POLYGON_AMOY,
            from_address="0x1234567890123456789012345678901234567890",
            to_address="0x0987654321098765432109876543210987654321",
            start_date=datetime.datetime(2023, 5, 8),
            end_date=datetime.datetime(2023, 6, 8),
        )
    )
    ```
"""

from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from web3 import Web3
from human_protocol_sdk.filter import TransactionFilter
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch


class InternalTransaction:
    """Represents an internal transaction within a parent transaction.

    Internal transactions are contract-to-contract calls that occur within
    the execution of a main transaction.

    Attributes:
        from_address (str): Source address of the internal transaction.
        to_address (str): Destination address of the internal transaction.
        value (int): Value transferred in token's smallest unit.
        method (str): Method signature called in the internal transaction.
        receiver (Optional[str]): Receiver address if applicable.
        escrow (Optional[str]): Escrow address if the transaction involves an escrow.
        token (Optional[str]): Token address if the transaction involves a token transfer.
    """

    def __init__(
        self,
        from_address: str,
        to_address: str,
        value: int,
        method: str,
        receiver: Optional[str],
        escrow: Optional[str],
        token: Optional[str],
    ):
        self.from_address = from_address
        self.to_address = to_address
        self.value = value
        self.method = method
        self.receiver = receiver
        self.escrow = escrow
        self.token = token


class TransactionData:
    """Represents on-chain transaction data retrieved from the subgraph.

    Attributes:
        chain_id (ChainId): Chain where the transaction was executed.
        block (int): Block number containing the transaction.
        tx_hash (str): Transaction hash.
        from_address (str): Sender address.
        to_address (str): Recipient address (contract or EOA).
        timestamp (int): Transaction timestamp in milliseconds.
        value (int): Value transferred in the main transaction.
        method (str): Method signature of the transaction.
        receiver (Optional[str]): Receiver address if applicable.
        escrow (Optional[str]): Escrow address if the transaction involves an escrow.
        token (Optional[str]): Token address if the transaction involves a token transfer.
        internal_transactions (List[InternalTransaction]): List of internal transactions.
    """

    def __init__(
        self,
        chain_id: ChainId,
        block: int,
        tx_hash: str,
        from_address: str,
        to_address: str,
        timestamp: int,
        value: int,
        method: str,
        receiver: Optional[str],
        escrow: Optional[str],
        token: Optional[str],
        internal_transactions: List[InternalTransaction],
    ):
        self.chain_id = chain_id
        self.block = block
        self.tx_hash = tx_hash
        self.from_address = from_address
        self.to_address = to_address
        self.timestamp = timestamp * 1000
        self.value = value
        self.method = method
        self.receiver = receiver
        self.escrow = escrow
        self.token = token
        self.internal_transactions = internal_transactions


class TransactionUtilsError(Exception):
    """Exception raised when transaction lookup or query operations fail."""

    pass


class TransactionUtils:
    """Utility class providing transaction query functions from the subgraph.

    This class offers static methods to fetch on-chain transaction data including
    individual transactions by hash and filtered transaction lists with support for
    internal transactions.
    """

    @staticmethod
    def get_transaction(
        chain_id: ChainId, hash: str, options: Optional[SubgraphOptions] = None
    ) -> Optional[TransactionData]:
        """Retrieve a single transaction by its hash.

        Fetches detailed transaction information including internal transactions
        from the subgraph.

        Args:
            chain_id (ChainId): Network where the transaction was executed.
            hash (str): Transaction hash to look up.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Transaction data if found, otherwise ``None``.

        Raises:
            TransactionUtilsError: If the chain ID is not supported.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.transaction import TransactionUtils

            tx = TransactionUtils.get_transaction(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890abcdef1234567890abcdef12",
            )
            if tx:
                print(f"Block: {tx.block}")
                print(f"From: {tx.from_address}")
                print(f"To: {tx.to_address}")
                print(f"Value: {tx.value}")
                print(f"Internal txs: {len(tx.internal_transactions)}")
            ```
        """
        network = NETWORKS.get(chain_id)
        if not network:
            raise TransactionUtilsError("Unsupported Chain ID")

        from human_protocol_sdk.gql.transaction import get_transaction_query

        transaction_data = custom_gql_fetch(
            network,
            query=get_transaction_query(),
            params={"hash": hash.lower()},
            options=options,
        )
        if (
            not transaction_data
            or "data" not in transaction_data
            or "transaction" not in transaction_data["data"]
            or not transaction_data["data"]["transaction"]
        ):
            return None

        transaction = transaction_data["data"]["transaction"]

        return TransactionData(
            chain_id=chain_id,
            block=int(transaction.get("block")),
            tx_hash=transaction.get("txHash"),
            from_address=transaction.get("from"),
            to_address=transaction.get("to"),
            timestamp=int(transaction.get("timestamp")),
            value=int(transaction.get("value")),
            method=transaction.get("method"),
            receiver=transaction.get("receiver"),
            escrow=transaction.get("escrow"),
            token=transaction.get("token"),
            internal_transactions=[
                InternalTransaction(
                    from_address=internal_tx.get("from"),
                    to_address=internal_tx.get("to"),
                    value=int(internal_tx.get("value")),
                    method=internal_tx.get("method"),
                    receiver=internal_tx.get("receiver"),
                    escrow=internal_tx.get("escrow"),
                    token=internal_tx.get("token"),
                )
                for internal_tx in transaction.get("internalTransactions", [])
            ],
        )

    @staticmethod
    def get_transactions(
        filter: TransactionFilter, options: Optional[SubgraphOptions] = None
    ) -> List[TransactionData]:
        """Retrieve a list of transactions matching the provided filter criteria.

        Queries the subgraph for transactions that match the specified parameters
        including addresses, date/block ranges, method signatures, and related contracts.

        Args:
            filter (TransactionFilter): Filter parameters including chain ID, sender/recipient
                addresses, date/block ranges, method signature, escrow address, token address,
                pagination, and sorting options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of transactions matching the filter criteria.
                Returns an empty list if no matches are found.

        Raises:
            TransactionUtilsError: If the chain ID is not supported.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter
            import datetime

            # Get all transactions from a specific address
            txs = TransactionUtils.get_transactions(
                TransactionFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    from_address="0x1234567890123456789012345678901234567890",
                )
            )

            # Get transactions within a date range with method filter
            txs = TransactionUtils.get_transactions(
                TransactionFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    from_address="0x1234567890123456789012345678901234567890",
                    to_address="0x0987654321098765432109876543210987654321",
                    method="transfer",
                    start_date=datetime.datetime(2023, 5, 8),
                    end_date=datetime.datetime(2023, 6, 8),
                )
            )

            # Get transactions involving specific escrow
            txs = TransactionUtils.get_transactions(
                TransactionFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    escrow="0x0987654321098765432109876543210987654321",
                    start_block=1000000,
                    end_block=2000000,
                )
            )

            for tx in txs:
                print(f"{tx.tx_hash}: {tx.method} - {tx.value}")
            ```
        """
        from human_protocol_sdk.gql.transaction import get_transactions_query

        network_data = NETWORKS.get(filter.chain_id)
        if not network_data:
            raise TransactionUtilsError("Unsupported Chain ID")

        data = custom_gql_fetch(
            network_data,
            query=get_transactions_query(filter),
            params={
                "fromAddress": (
                    filter.from_address.lower() if filter.from_address else None
                ),
                "toAddress": (filter.to_address.lower() if filter.to_address else None),
                "startDate": (
                    int(filter.start_date.timestamp()) if filter.start_date else None
                ),
                "endDate": (
                    int(filter.end_date.timestamp()) if filter.end_date else None
                ),
                "startBlock": filter.start_block if filter.start_block else None,
                "endBlock": filter.end_block if filter.end_block else None,
                "method": filter.method if filter.method else None,
                "escrow": (filter.escrow.lower() if filter.escrow else None),
                "token": (filter.token.lower() if filter.token else None),
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
            options=options,
        )
        if (
            not data
            or "data" not in data
            or "transactions" not in data["data"]
            or not data["data"]["transactions"]
        ):
            return []

        transactions_raw = data["data"]["transactions"]

        transactions = []
        transactions.extend(
            [
                TransactionData(
                    chain_id=filter.chain_id,
                    block=int(transaction.get("block")),
                    tx_hash=transaction.get("txHash"),
                    from_address=transaction.get("from"),
                    to_address=transaction.get("to"),
                    timestamp=int(transaction.get("timestamp")),
                    value=int(transaction.get("value")),
                    method=transaction.get("method"),
                    receiver=transaction.get("receiver"),
                    escrow=transaction.get("escrow"),
                    token=transaction.get("token"),
                    internal_transactions=[
                        InternalTransaction(
                            from_address=internal_tx.get("from"),
                            to_address=internal_tx.get("to"),
                            value=int(internal_tx.get("value")),
                            method=internal_tx.get("method"),
                            receiver=internal_tx.get("receiver"),
                            escrow=internal_tx.get("escrow"),
                            token=internal_tx.get("token"),
                        )
                        for internal_tx in transaction.get("internalTransactions", [])
                    ],
                )
                for transaction in transactions_raw
            ]
        )

        return transactions
