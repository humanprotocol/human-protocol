import unittest
from unittest.mock import patch

from human_protocol_sdk.constants import NETWORKS, ChainId, OrderDirection
from human_protocol_sdk.worker.worker_utils import WorkerUtils, WorkerUtilsError
from human_protocol_sdk.filter import WorkerFilter
from human_protocol_sdk.gql.worker import get_worker_query, get_workers_query


class TestWorkerUtils(unittest.TestCase):
    def test_get_workers(self):
        with patch(
            "human_protocol_sdk.worker.worker_utils.custom_gql_fetch"
        ) as mock_function:
            mock_worker_1 = {
                "id": "worker1",
                "address": "0x1234567890123456789012345678901234567890",
                "totalHMTAmountReceived": "1000",
                "payoutCount": 5,
            }
            mock_worker_2 = {
                "id": "worker2",
                "address": "0x9876543210987654321098765432109876543210",
                "totalHMTAmountReceived": "2000",
                "payoutCount": 10,
            }

            mock_function.return_value = {
                "data": {"workers": [mock_worker_1, mock_worker_2]}
            }

            filter = WorkerFilter(
                chain_id=ChainId.POLYGON_AMOY,
                order_by="totalHMTAmountReceived",
                order_direction=OrderDirection.ASC,
            )

            workers = WorkerUtils.get_workers(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_workers_query(filter),
                params={
                    "address": None,
                    "first": 10,
                    "skip": 0,
                    "orderBy": "totalHMTAmountReceived",
                    "orderDirection": "asc",
                },
                retry_config=None,
            )
            self.assertEqual(len(workers), 2)
            self.assertEqual(workers[0].id, "worker1")
            self.assertEqual(workers[1].id, "worker2")

    def test_get_workers_empty_response(self):
        with patch(
            "human_protocol_sdk.worker.worker_utils.custom_gql_fetch"
        ) as mock_function:
            mock_function.return_value = {"data": {"workers": []}}

            filter = WorkerFilter(
                chain_id=ChainId.POLYGON_AMOY,
                worker_address="0x1234567890123456789012345678901234567890",
            )

            workers = WorkerUtils.get_workers(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_workers_query(filter),
                params={
                    "address": "0x1234567890123456789012345678901234567890",
                    "first": 10,
                    "skip": 0,
                    "orderBy": "payoutCount",
                    "orderDirection": "desc",
                },
                retry_config=None,
            )
            self.assertEqual(len(workers), 0)

    def test_get_workers_invalid_network(self):
        with self.assertRaises(ValueError) as cm:
            filter = WorkerFilter(chain_id=ChainId(12345))
            WorkerUtils.get_workers(filter)
        self.assertEqual("12345 is not a valid ChainId", str(cm.exception))

    def test_get_worker(self):
        with patch(
            "human_protocol_sdk.worker.worker_utils.custom_gql_fetch"
        ) as mock_function:
            mock_worker = {
                "id": "worker1",
                "address": "0x1234567890123456789012345678901234567890",
                "totalHMTAmountReceived": "1000",
                "payoutCount": 5,
            }

            mock_function.return_value = {"data": {"worker": mock_worker}}

            worker = WorkerUtils.get_worker(
                ChainId.POLYGON_AMOY,
                "0x1234567890123456789012345678901234567890",
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_worker_query(),
                params={"address": "0x1234567890123456789012345678901234567890"},
                retry_config=None,
            )
            self.assertIsNotNone(worker)
            self.assertEqual(worker.id, "worker1")
            self.assertEqual(
                worker.address, "0x1234567890123456789012345678901234567890"
            )

    def test_get_worker_empty_data(self):
        with patch(
            "human_protocol_sdk.worker.worker_utils.custom_gql_fetch"
        ) as mock_function:
            mock_function.return_value = {"data": {"worker": None}}

            worker = WorkerUtils.get_worker(
                ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890"
            )

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_worker_query(),
                params={"address": "0x1234567890123456789012345678901234567890"},
                retry_config=None,
            )

            self.assertIsNone(worker)

    def test_get_worker_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            WorkerUtils.get_worker(
                ChainId(123), "0x1234567890123456789012345678901234567891"
            )
        self.assertEqual("123 is not a valid ChainId", str(cm.exception))

    def test_get_worker_invalid_address(self):
        with self.assertRaises(WorkerUtilsError) as cm:
            WorkerUtils.get_worker(ChainId.POLYGON_AMOY, "invalid_address")
        self.assertEqual("Invalid operator address: invalid_address", str(cm.exception))


if __name__ == "__main__":
    unittest.main(exit=True)
