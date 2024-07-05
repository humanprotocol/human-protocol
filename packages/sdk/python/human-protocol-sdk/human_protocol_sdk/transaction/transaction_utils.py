"""
Utility class for transaction-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter

    print(
        TransactionUtils.get_transactions(
            TransactionFilter(
                networks=[ChainId.POLYGON_AMOY],
                from_address="0x1234567890123456789012345678901234567890",
                to_address="0x0987654321098765432109876543210987654321",
                start_date=datetime.datetime(2023, 5, 8),
                end_date=datetime.datetime(2023, 6, 8),
            )
        )
    )

Module
------
"""

from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from web3 import Web3
from human_protocol_sdk.filter import TransactionFilter
from human_protocol_sdk.utils import get_data_from_subgraph


class TransactionData:
    def __init__(
        self,
        chain_id: ChainId,
        block: int,
        hash: str,
        from_address: str,
        to_address: str,
        timestamp: int,
        value: str,
        method: str,
    ):
        self.chain_id = chain_id
        self.block = block
        self.hash = hash
        self.from_address = from_address
        self.to_address = to_address
        self.timestamp = timestamp
        self.value = value
        self.method = method


class TransactionUtilsError(Exception):
    """
    Raises when some error happens when getting data from subgraph.
    """

    pass


class TransactionUtils:
    """
    A utility class that provides additional transaction-related functionalities.
    """

    @staticmethod
    def get_transaction(chain_id: ChainId, hash: str) -> Optional[TransactionData]:
        """Returns the transaction for a given hash.

        :param chain_id: Network in which the transaction was executed
        :param hash: Hash of the transaction

        :return: Transaction data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.transaction import TransactionUtils

                print(
                    TransactionUtils.get_transaction(
                        ChainId.POLYGON_AMOY,
                        "0x1234567890123456789012345678901234567891"
                    )
                )
        """
        network = NETWORKS.get(chain_id)
        if not network:
            raise TransactionUtilsError("Unsupported Chain ID")

        from human_protocol_sdk.gql.transaction import get_transaction_query

        transaction_data = get_data_from_subgraph(
            network,
            query=get_transaction_query(),
            params={"hash": hash.lower()},
        )
        transaction = transaction_data["data"]["transaction"]

        if not transaction:
            return None

        return TransactionData(
            chain_id=chain_id,
            block=transaction.get("block", 0),
            hash=transaction.get("txHash", ""),
            from_address=transaction.get("from", ""),
            to_address=transaction.get("to", ""),
            timestamp=transaction.get("timestamp", 0),
            value=transaction.get("value", ""),
            method=transaction.get("method", ""),
        )

    @staticmethod
    def get_transactions(filter: TransactionFilter) -> List[TransactionData]:
        """Get an array of transactions based on the specified filter parameters.

        :param filter: Object containing all the necessary parameters to filter

        :return: List of transactions

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter

                print(
                    TransactionUtils.get_transactions(
                        TransactionFilter(
                            chain_id=ChainId.POLYGON_AMOY,
                            from_address="0x1234567890123456789012345678901234567890",
                            to_address="0x0987654321098765432109876543210987654321",
                            start_date=datetime.datetime(2023, 5, 8),
                            end_date=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.transaction import get_transactions_query

        network_data = NETWORKS.get(filter.chain_id)
        if not network_data:
            raise TransactionUtilsError("Unsupported Chain ID")

        data = get_data_from_subgraph(
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
                "first": filter.first,
                "skip": filter.skip,
                "orderDirection": filter.order_direction.value,
            },
        )
        if not data or "data" not in data or "transactions" not in data["data"]:
            return []

        transactions_raw = data["data"]["transactions"]

        transactions = []
        transactions.extend(
            [
                TransactionData(
                    chain_id=filter.chain_id,
                    block=transaction.get("block", 0),
                    hash=transaction.get("txHash", ""),
                    from_address=transaction.get("from", ""),
                    to_address=transaction.get("to", ""),
                    timestamp=transaction.get("timestamp", 0),
                    value=transaction.get("value", ""),
                    method=transaction.get("method", ""),
                )
                for transaction in transactions_raw
            ]
        )

        return transactions
