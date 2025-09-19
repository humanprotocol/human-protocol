import unittest
from unittest.mock import patch

from human_protocol_sdk.constants import NETWORKS, ChainId, OrderDirection
from human_protocol_sdk.filter import StakersFilter
from human_protocol_sdk.staking.staking_utils import (
    StakingUtils,
    StakingUtilsError,
    StakerData,
)
from human_protocol_sdk.gql.staking import get_staker_query, get_stakers_query


class TestStakingUtils(unittest.TestCase):
    def test_get_stakers(self):
        with patch(
            "human_protocol_sdk.staking.staking_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_staker_1 = {
                "id": "1",
                "address": "0x123",
                "stakedAmount": "1000",
                "lockedAmount": "100",
                "withdrawnAmount": "900",
                "slashedAmount": "0",
                "lockedUntilTimestamp": "1234567890",
                "lastDepositTimestamp": "1234567891",
            }
            mock_staker_2 = {
                "id": "2",
                "address": "0x456",
                "stakedAmount": "2000",
                "lockedAmount": "200",
                "withdrawnAmount": "1800",
                "slashedAmount": "0",
                "lockedUntilTimestamp": "1234567892",
                "lastDepositTimestamp": "1234567893",
            }

            mock_function.return_value = {
                "data": {"stakers": [mock_staker_1, mock_staker_2]}
            }

            filter = StakersFilter(
                chain_id=ChainId.POLYGON_AMOY,
                min_staked_amount="1000",
                order_by="stakedAmount",
                order_direction=OrderDirection.ASC,
                first=2,
                skip=0,
            )

            stakers = StakingUtils.get_stakers(filter)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_stakers_query(filter),
                params={
                    "minStakedAmount": "1000",
                    "maxStakedAmount": None,
                    "minLockedAmount": None,
                    "maxLockedAmount": None,
                    "minWithdrawnAmount": None,
                    "maxWithdrawnAmount": None,
                    "minSlashedAmount": None,
                    "maxSlashedAmount": None,
                    "orderBy": "stakedAmount",
                    "orderDirection": "asc",
                    "first": 2,
                    "skip": 0,
                },
            )
            self.assertEqual(len(stakers), 2)
            self.assertIsInstance(stakers[0], StakerData)
            self.assertEqual(stakers[0].id, "1")
            self.assertEqual(stakers[1].id, "2")

    def test_get_stakers_empty_response(self):
        with patch(
            "human_protocol_sdk.staking.staking_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {"data": {"stakers": []}}

            filter = StakersFilter(chain_id=ChainId.POLYGON_AMOY)

            stakers = StakingUtils.get_stakers(filter)

            mock_function.assert_called_once()
            self.assertEqual(len(stakers), 0)

    def test_get_stakers_invalid_network(self):
        with self.assertRaises(ValueError) as cm:
            filter = StakersFilter(chain_id=ChainId(123))
            StakingUtils.get_stakers(filter)
        self.assertEqual(str(cm.exception), "123 is not a valid ChainId")

    def test_get_staker(self):
        with patch(
            "human_protocol_sdk.staking.staking_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_staker = {
                "id": "1",
                "address": "0x123",
                "stakedAmount": "1000",
                "lockedAmount": "100",
                "withdrawnAmount": "900",
                "slashedAmount": "0",
                "lockedUntilTimestamp": "1234567890",
                "lastDepositTimestamp": "1234567891",
            }

            mock_function.return_value = {"data": {"staker": mock_staker}}

            staker = StakingUtils.get_staker(ChainId.POLYGON_AMOY, "0x123")

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON_AMOY],
                query=get_staker_query(),
                params={"id": "0x123"},
            )
            self.assertIsInstance(staker, StakerData)
            self.assertEqual(staker.id, "1")
            self.assertEqual(staker.address, "0x123")

    def test_get_staker_empty_data(self):
        with patch(
            "human_protocol_sdk.staking.staking_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {"data": {"staker": None}}

            staker = StakingUtils.get_staker(ChainId.POLYGON_AMOY, "0x123")

            mock_function.assert_called_once()
            self.assertIsNone(staker)

    def test_get_staker_invalid_chain_id(self):
        with self.assertRaises(ValueError) as cm:
            StakingUtils.get_staker(ChainId(123), "0x123")
        self.assertEqual(str(cm.exception), "123 is not a valid ChainId")


if __name__ == "__main__":
    unittest.main(exit=True)
