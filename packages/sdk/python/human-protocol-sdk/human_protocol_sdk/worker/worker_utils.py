"""Utility helpers for worker-related queries.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.worker import WorkerUtils, WorkerFilter

    workers = WorkerUtils.get_workers(
        WorkerFilter(chain_id=ChainId.POLYGON_AMOY)
    )
    for worker in workers:
        print(f"{worker.address}: {worker.total_amount_received}")
    ```
"""

import logging
from typing import List, Optional

from web3 import Web3

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from human_protocol_sdk.filter import WorkerFilter

LOG = logging.getLogger("human_protocol_sdk.worker")


class WorkerUtilsError(Exception):
    """Exception raised when errors occur during worker data retrieval operations."""

    pass


class WorkerData:
    """Represents worker information retrieved from the subgraph.

    Attributes:
        id (str): Unique worker identifier.
        address (str): Worker's Ethereum address.
        total_amount_received (int): Total amount of HMT tokens received by the worker.
        payout_count (int): Number of payouts the worker has received.
    """

    def __init__(
        self,
        id: str,
        address: str,
        total_amount_received: str,
        payout_count: str,
    ):
        self.id = id
        self.address = address
        self.total_amount_received = int(total_amount_received)
        self.payout_count = int(payout_count)


class WorkerUtils:
    """Utility class providing worker-related query and data retrieval functions.

    This class offers static methods to fetch worker data from the Human Protocol
    subgraph, including filtered worker lists and individual worker details.
    """

    @staticmethod
    def get_workers(
        filter: WorkerFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[WorkerData]:
        """Retrieve a list of workers matching the provided filter criteria.

        Queries the subgraph for workers based on the specified parameters including
        address filters, ordering preferences, and pagination.

        Args:
            filter (WorkerFilter): Filter parameters including chain ID, worker address,
                ordering, and pagination options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests
                such as custom endpoints or timeout settings.

        Returns:
            A list of worker records matching the filter criteria.
                Returns an empty list if no matches are found.

        Raises:
            WorkerUtilsError: If the chain ID is not supported.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.worker import WorkerUtils, WorkerFilter

            # Get all workers
            workers = WorkerUtils.get_workers(
                WorkerFilter(chain_id=ChainId.POLYGON_AMOY)
            )
            for worker in workers:
                print(f"{worker.address}: {worker.total_amount_received} HMT")

            # Get specific worker
            workers = WorkerUtils.get_workers(
                WorkerFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    worker_address="0x1234567890123456789012345678901234567890",
                )
            )
            ```
        """

        from human_protocol_sdk.gql.worker import get_workers_query

        workers = []
        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise WorkerUtilsError("Unsupported Chain ID")

        workers_data = custom_gql_fetch(
            network,
            query=get_workers_query(filter),
            params={
                "address": filter.worker_address,
                "orderBy": filter.order_by,
                "orderDirection": filter.order_direction.value,
                "first": filter.first,
                "skip": filter.skip,
            },
            options=options,
        )

        if (
            not workers_data
            or "data" not in workers_data
            or "workers" not in workers_data["data"]
            or not workers_data["data"]["workers"]
        ):
            return []

        workers_raw = workers_data["data"]["workers"]

        for worker in workers_raw:
            workers.append(
                WorkerData(
                    id=worker.get("id"),
                    address=worker.get("address"),
                    total_amount_received=worker.get("totalHMTAmountReceived"),
                    payout_count=worker.get("payoutCount"),
                )
            )

        return workers

    @staticmethod
    def get_worker(
        chain_id: ChainId,
        worker_address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[WorkerData]:
        """Retrieve a single worker by their address.

        Fetches detailed information about a specific worker from the subgraph,
        including their total earnings and payout history.

        Args:
            chain_id (ChainId): Network where the worker has participated.
            worker_address (str): Ethereum address of the worker.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Worker data if found, otherwise ``None``.

        Raises:
            WorkerUtilsError: If the chain ID is not supported or the worker address is invalid.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.worker import WorkerUtils

            worker = WorkerUtils.get_worker(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )
            if worker:
                print(f"Total received: {worker.total_amount_received} HMT")
                print(f"Payout count: {worker.payout_count}")
            ```
        """

        from human_protocol_sdk.gql.worker import get_worker_query

        network = NETWORKS.get(chain_id)
        if not network:
            raise WorkerUtilsError("Unsupported Chain ID")

        if not Web3.is_address(worker_address):
            raise WorkerUtilsError(f"Invalid worker address: {worker_address}")

        network = NETWORKS[chain_id]
        worker_data = custom_gql_fetch(
            network,
            query=get_worker_query(),
            params={"address": worker_address.lower()},
            options=options,
        )

        if (
            not worker_data
            or "data" not in worker_data
            or "worker" not in worker_data["data"]
            or not worker_data["data"]["worker"]
        ):
            return None

        worker = worker_data["data"]["worker"]

        return WorkerData(
            id=worker.get("id"),
            address=worker.get("address"),
            total_amount_received=worker.get("totalHMTAmountReceived"),
            payout_count=worker.get("payoutCount"),
        )
