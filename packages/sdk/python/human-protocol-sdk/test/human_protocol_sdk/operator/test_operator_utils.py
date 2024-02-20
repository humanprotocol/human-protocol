import unittest
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER
from unittest.mock import MagicMock, patch

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.gql.operator import (
    get_leader_query,
    get_leaders_query,
    get_reputation_network_query,
)
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.operator import LeaderFilter, OperatorUtils


class TestOperatorUtils(unittest.TestCase):
    def test_get_leaders(self):
        filter = LeaderFilter(networks=[ChainId.POLYGON], role="role")
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "leaders": [
                            {
                                "id": DEFAULT_GAS_PAYER,
                                "address": DEFAULT_GAS_PAYER,
                                "amountStaked": "100",
                                "amountAllocated": "50",
                                "amountLocked": "25",
                                "lockedUntilTimestamp": "0",
                                "amountWithdrawn": "25",
                                "amountSlashed": "25",
                                "reputation": "25",
                                "reward": "25",
                                "amountJobsLaunched": "25",
                                "role": "role",
                                "fee": None,
                                "publicKey": None,
                                "webhookUrl": None,
                                "url": None,
                            }
                        ],
                    }
                }
            ]

            leaders = OperatorUtils.get_leaders(filter)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON]["subgraph_url"],
                query=get_leaders_query(filter),
                params={"role": filter.role},
            )

            self.assertEqual(len(leaders), 1)
            self.assertEqual(leaders[0].id, DEFAULT_GAS_PAYER)
            self.assertEqual(leaders[0].address, DEFAULT_GAS_PAYER)
            self.assertEqual(leaders[0].amount_staked, 100)
            self.assertEqual(leaders[0].amount_allocated, 50)
            self.assertEqual(leaders[0].amount_locked, 25)
            self.assertEqual(leaders[0].locked_until_timestamp, 0)
            self.assertEqual(leaders[0].amount_withdrawn, 25)
            self.assertEqual(leaders[0].amount_slashed, 25)
            self.assertEqual(leaders[0].reputation, 25)
            self.assertEqual(leaders[0].reward, 25)
            self.assertEqual(leaders[0].amount_jobs_launched, 25)
            self.assertEqual(leaders[0].role, "role")
            self.assertEqual(leaders[0].fee, None)
            self.assertEqual(leaders[0].public_key, None)
            self.assertEqual(leaders[0].webhook_url, None)
            self.assertEqual(leaders[0].url, None)

    def test_get_leader(self):
        staker_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "leader": {
                            "id": staker_address,
                            "address": staker_address,
                            "amountStaked": "100",
                            "amountAllocated": "50",
                            "amountLocked": "25",
                            "lockedUntilTimestamp": "0",
                            "amountWithdrawn": "25",
                            "amountSlashed": "25",
                            "reputation": "25",
                            "reward": "25",
                            "amountJobsLaunched": "25",
                            "role": "role",
                            "fee": None,
                            "publicKey": None,
                            "webhookUrl": None,
                            "url": None,
                        }
                    }
                }
            ]

            leader = OperatorUtils.get_leader(ChainId.POLYGON, staker_address)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON]["subgraph_url"],
                query=get_leader_query,
                params={"address": staker_address},
            )

            self.assertNotEqual(leader, None)
            self.assertEqual(leader.id, staker_address)
            self.assertEqual(leader.address, staker_address)
            self.assertEqual(leader.amount_staked, 100)
            self.assertEqual(leader.amount_allocated, 50)
            self.assertEqual(leader.amount_locked, 25)
            self.assertEqual(leader.locked_until_timestamp, 0)
            self.assertEqual(leader.amount_withdrawn, 25)
            self.assertEqual(leader.amount_slashed, 25)
            self.assertEqual(leader.reputation, 25)
            self.assertEqual(leader.reward, 25)
            self.assertEqual(leader.amount_jobs_launched, 25)
            self.assertEqual(leader.role, "role")
            self.assertEqual(leader.fee, None)
            self.assertEqual(leader.public_key, None)
            self.assertEqual(leader.webhook_url, None)
            self.assertEqual(leader.url, None)

    def test_get_reputation_network_operators(self):
        reputation_address = "0x1234567890123456789012345678901234567891"
        operator_address = "0x1234567890123456789012345678901234567891"
        role = "Job Launcher"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "reputationNetwork": {
                            "id": reputation_address,
                            "address": reputation_address,
                            "operators": [{"address": operator_address, "role": role}],
                        }
                    }
                }
            ]

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON, reputation_address
            )

        mock_function.assert_any_call(
            NETWORKS[ChainId.POLYGON]["subgraph_url"],
            query=get_reputation_network_query(None),
            params={"address": reputation_address, "role": None},
        )

        self.assertNotEqual(operators, [])
        self.assertEqual(operators[0].address, operator_address)
        self.assertEqual(operators[0].role, role)

    def test_get_rewards_info(self):
        slasher = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()
        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {
                "data": {
                    "rewardAddedEvents": [
                        {
                            "escrowAddress": "escrow1",
                            "amount": 10,
                        },
                        {
                            "escrowAddress": "escrow2",
                            "amount": 20,
                        },
                    ]
                }
            }
            rewards_info = OperatorUtils.get_rewards_info(ChainId.POLYGON, slasher)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON]["subgraph_url"],
                query=get_reward_added_events_query,
                params={"slasherAddress": slasher},
            )

            self.assertEqual(len(rewards_info), 2)
            self.assertEqual(rewards_info[0].escrow_address.lower(), "escrow1")
            self.assertEqual(rewards_info[0].amount, 10)
            self.assertEqual(rewards_info[1].escrow_address.lower(), "escrow2")
            self.assertEqual(rewards_info[1].amount, 20)


if __name__ == "__main__":
    unittest.main(exit=True)
