import logging
from typing import List, Optional

from web3 import Web3

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.utils import get_data_from_subgraph
from human_protocol_sdk.filter import WorkerFilter

LOG = logging.getLogger("human_protocol_sdk.worker")


class WorkerUtilsError(Exception):
    """
    Raised when an error occurs when getting data from subgraph.
    """

    pass


class WorkerData:
    def __init__(
        self,
        id: str,
        address: str,
        total_amount_received: int,
        payout_count: int,
    ):
        """
        Initializes a WorkerData instance.

        :param id: Worker ID
        :param address: Worker address
        :param total_amount_received: Total amount received by the worker
        :param payout_count: Number of payouts received by the worker
        """

        self.id = id
        self.address = address
        self.total_amount_received = total_amount_received
        self.payout_count = payout_count


class WorkerUtils:
    """
    A utility class that provides additional worker-related functionalities.
    """

    @staticmethod
    def get_workers(filter: WorkerFilter) -> List[WorkerData]:
        """Get workers data of the protocol.

        :param filter: Worker filter

        :return: List of workers data
        """

        from human_protocol_sdk.gql.worker import get_workers_query

        workers = []
        network = NETWORKS.get(filter.chain_id)
        if not network:
            raise WorkerUtilsError("Unsupported Chain ID")

        workers_data = get_data_from_subgraph(
            network,
            query=get_workers_query(filter),
            params={
                "address": filter.worker_address,
                "orderBy": filter.order_by,
                "orderDirection": filter.order_direction.value,
                "first": filter.first,
                "skip": filter.skip,
            },
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
                    id=worker.get("id", ""),
                    address=worker.get("address", ""),
                    total_amount_received=int(worker.get("totalHMTAmountReceived", 0)),
                    payout_count=int(worker.get("payoutCount", 0)),
                )
            )

        return workers

    @staticmethod
    def get_worker(chain_id: ChainId, worker_address: str) -> Optional[WorkerData]:
        """Gets the worker details.

        :param chain_id: Network in which the worker exists
        :param worker_address: Address of the worker

        :return: Worker data if exists, otherwise None
        """

        from human_protocol_sdk.gql.worker import get_worker_query

        network = NETWORKS.get(chain_id)
        if not network:
            raise WorkerUtilsError("Unsupported Chain ID")

        if not Web3.is_address(worker_address):
            raise WorkerUtilsError(f"Invalid operator address: {worker_address}")

        network = NETWORKS[chain_id]
        worker_data = get_data_from_subgraph(
            network,
            query=get_worker_query(),
            params={"address": worker_address.lower()},
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
            id=worker.get("id", ""),
            address=worker.get("address", ""),
            total_amount_received=int(worker.get("totalHMTAmountReceived", 0)),
            payout_count=int(worker.get("payoutCount", 0)),
        )
