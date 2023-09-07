import unittest
from unittest.mock import MagicMock, PropertyMock, patch

import web3
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.rpc import HTTPProvider

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.gql.staking import get_leader_query, get_leaders_query
from human_protocol_sdk.staking import StakingClient, LeaderFilter, StakingClientError

from test.human_protocol_sdk.utils import (
    DEFAULT_GAS_PAYER_PRIV,
)


class StakingTestCase(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock(spec=HTTPProvider)
        self.w3 = Web3(self.mock_provider)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        self.w3.eth.default_account = self.gas_payer.address

        self.mock_chain_id = ChainId.LOCALHOST.value
        type(self.w3.eth).chain_id = PropertyMock(return_value=self.mock_chain_id)

        self.staking_client = StakingClient(self.w3)

    def test_init_with_valid_inputs(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        staking_client = StakingClient(w3)

        self.assertEqual(staking_client.w3, w3)
        self.assertEqual(staking_client.network, NETWORKS[ChainId(mock_chain_id)])
        self.assertIsNotNone(staking_client.hmtoken_contract)
        self.assertIsNotNone(staking_client.factory_contract)
        self.assertIsNotNone(staking_client.staking_contract)
        self.assertIsNotNone(staking_client.reward_pool_contract)

    def test_init_with_invalid_chain_id(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = 9999
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(StakingClientError) as cm:
            StakingClient(w3)
        self.assertEqual("Invalid ChainId: 9999", str(cm.exception))

    def test_init_with_invalid_web3(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = None
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(StakingClientError) as cm:
            StakingClient(w3)
        self.assertEqual(f"Invalid Web3 Instance", str(cm.exception))

    def test_approve_stake(self):
        mock_function = MagicMock()
        self.staking_client.hmtoken_contract.functions.approve = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.approve_stake(100)

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Approve stake", mock_function.return_value, StakingClientError
            )
            mock_function.assert_called_once_with(
                NETWORKS[ChainId.LOCALHOST]["staking_address"], 100
            )

    def test_approve_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.approve_stake(-1)
        self.assertEqual("Amount to approve must be greater than 0", str(cm.exception))

    def test_stake(self):
        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.stake = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.stake(100)

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Stake HMT", mock_function.return_value, StakingClientError
            )
            mock_function.assert_called_once_with(100)

    def test_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.stake(-1)
        self.assertEqual("Amount to stake must be greater than 0", str(cm.exception))

    def test_allocate(self):
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.allocate = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.allocate(escrow_address, 10)

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Allocate HMT", mock_function.return_value, StakingClientError
            )
            mock_function.assert_called_once_with(escrow_address, 10)

    def test_allocate_invalid_amount(self):
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.allocate(escrow_address, -1)
        self.assertEqual("Amount to allocate must be greater than 0", str(cm.exception))

    def test_allocate_invalid_escrow(self):
        escrow_address = "invalid_escrow"
        self.staking_client._is_valid_escrow = MagicMock(return_value=False)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.allocate(escrow_address, 10)
        self.assertEqual("Invalid escrow address: invalid_escrow", str(cm.exception))

    def test_close_allocation(self):
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.closeAllocation = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.close_allocation(escrow_address)

            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Close allocation",
                mock_function.return_value,
                StakingClientError,
            )
        mock_function.assert_called_once_with(escrow_address)

    def test_close_allocation_invalid_escrow(self):
        escrow_address = "invalid_escrow"
        self.staking_client._is_valid_escrow = MagicMock(return_value=False)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.close_allocation(escrow_address)
        self.assertEqual("Invalid escrow address: invalid_escrow", str(cm.exception))

    def test_unstake(self):
        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.unstake = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.unstake(100)

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Unstake HMT", mock_function.return_value, StakingClientError
            )
        mock_function.assert_called_once_with(100)

    def test_unstake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.unstake(-1)
        self.assertEqual("Amount to unstake must be greater than 0", str(cm.exception))

    def test_withdraw(self):
        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.withdraw = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.withdraw()

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Withdraw HMT", mock_function.return_value, StakingClientError
            )
            mock_function.assert_called_once()

    def test_slash(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_function = MagicMock()
        self.staking_client.staking_contract.functions.slash = mock_function

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.slash(
                slasher=slasher,
                staker=staker,
                escrow_address=escrow_address,
                amount=50,
            )

            mock_handle_transaction.assert_called_once_with(
                self.w3, "Slash HMT", mock_function.return_value, StakingClientError
            )
            mock_function.assert_called_once_with(slasher, staker, escrow_address, 50)

    def test_slash_invalid_amount(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.slash(
                slasher=slasher, staker=staker, escrow_address=escrow_address, amount=-1
            )
        self.assertEqual("Amount to slash must be greater than 0", str(cm.exception))

    def test_slash_invalid_escrow(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "invalid_escrow"
        self.staking_client._is_valid_escrow = MagicMock(return_value=False)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.slash(
                slasher=slasher, staker=staker, escrow_address=escrow_address, amount=10
            )
        self.assertEqual("Invalid escrow address: invalid_escrow", str(cm.exception))

    def test_distribute_reward(self):
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_function = MagicMock()
        self.staking_client.reward_pool_contract.functions.distributeReward = (
            mock_function
        )

        with patch(
            "human_protocol_sdk.staking.handle_transaction"
        ) as mock_handle_transaction:
            self.staking_client.distribute_reward(escrow_address)

            mock_handle_transaction.assert_called_once_with(
                self.w3,
                "Distribute reward",
                mock_function.return_value,
                StakingClientError,
            )
            mock_function.assert_called_once_with(escrow_address)

    def test_distribute_rewards_invalid(self):
        escrow_address = "invalid_escrow"
        self.staking_client._is_valid_escrow = MagicMock(return_value=False)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.distribute_reward(escrow_address)
        self.assertEqual("Invalid escrow address: invalid_escrow", str(cm.exception))

    def test_get_leaders(self):
        filter = LeaderFilter(role="role")
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.staking.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "leaders": [
                            {
                                "id": self.gas_payer.address,
                                "address": self.gas_payer.address,
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

            leaders = self.staking_client.get_leaders(filter)

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_leaders_query(filter),
                params={"role": filter.role},
            )

            self.assertEqual(
                leaders,
                [
                    {
                        "id": self.gas_payer.address,
                        "address": self.gas_payer.address,
                        "amount_staked": 100,
                        "amount_allocated": 50,
                        "amount_locked": 25,
                        "locked_until_timestamp": 0,
                        "amount_withdrawn": 25,
                        "amount_slashed": 25,
                        "reputation": 25,
                        "reward": 25,
                        "amount_jobs_launched": 25,
                        "role": "role",
                        "fee": None,
                        "public_key": None,
                        "webhook_url": None,
                        "url": None,
                    }
                ],
            )

    def test_get_leader(self):
        staker_address = "staker1"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.staking.get_data_from_subgraph"
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

            leader = self.staking_client.get_leader(staker_address)

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_leader_query,
                params={"address": staker_address},
            )

            self.assertEqual(
                leader,
                {
                    "id": staker_address,
                    "address": staker_address,
                    "amount_staked": 100,
                    "amount_allocated": 50,
                    "amount_locked": 25,
                    "locked_until_timestamp": 0,
                    "amount_withdrawn": 25,
                    "amount_slashed": 25,
                    "reputation": 25,
                    "reward": 25,
                    "amount_jobs_launched": 25,
                    "role": "role",
                    "fee": None,
                    "public_key": None,
                    "webhook_url": None,
                    "url": None,
                },
            )

    def test_get_leader_default_account(self):
        with patch(
            "human_protocol_sdk.staking.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "leader": {
                            "id": self.w3.eth.default_account,
                            "address": self.w3.eth.default_account,
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

            leader = self.staking_client.get_leader()

            mock_function.assert_any_call(
                "subgraph_url",
                query=get_leader_query,
                params={"address": self.w3.eth.default_account},
            )

            self.assertEqual(
                leader,
                {
                    "id": self.w3.eth.default_account,
                    "address": self.w3.eth.default_account,
                    "amount_staked": 100,
                    "amount_allocated": 50,
                    "amount_locked": 25,
                    "locked_until_timestamp": 0,
                    "amount_withdrawn": 25,
                    "amount_slashed": 25,
                    "reputation": 25,
                    "reward": 25,
                    "amount_jobs_launched": 25,
                    "role": "role",
                    "fee": None,
                    "public_key": None,
                    "webhook_url": None,
                    "url": None,
                },
            )

    def test_get_allocation(self):
        escrow_address = "escrow1"

        mock_function = MagicMock()
        mock_function.return_value.call.return_value = [
            escrow_address,
            "staker",
            10,
            10,
            0,
        ]
        self.staking_client.staking_contract.functions.getAllocation = mock_function

        allocation = self.staking_client.get_allocation(escrow_address)

        mock_function.assert_called_once_with(escrow_address)

        self.assertEqual(allocation["escrow_address"], escrow_address)
        self.assertEqual(allocation["staker"], "staker")
        self.assertEqual(allocation["tokens"], 10)
        self.assertNotEqual(allocation["created_at"], 0)
        self.assertEqual(allocation["closed_at"], 0)

    def test_get_allocation_invalid_address(self):
        escrow_address = "escrow1"

        mock_function = MagicMock()
        mock_function.return_value.call.return_value = [
            web3.constants.ADDRESS_ZERO,
            "staker",
            10,
            0,
            0,
        ]
        self.staking_client.staking_contract.functions.getAllocation = mock_function

        allocation = self.staking_client.get_allocation(escrow_address)

        mock_function.assert_called_once_with(escrow_address)

        self.assertIsNone(allocation)

    def test_get_rewards_info(self):
        slasher = "slasher1"

        mock_function = MagicMock()
        with patch(
            "human_protocol_sdk.staking.get_data_from_subgraph"
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
            rewards_info = self.staking_client.get_rewards_info(slasher)

            mock_function.assert_called_once_with(
                "subgraph_url",
                query=get_reward_added_events_query,
                params={"slasherAddress": slasher},
            )

            self.assertEqual(len(rewards_info), 2)
            self.assertEqual(rewards_info[0]["escrow_address"].lower(), "escrow1")
            self.assertEqual(rewards_info[0]["amount"], 10)
            self.assertEqual(rewards_info[1]["escrow_address"].lower(), "escrow2")
            self.assertEqual(rewards_info[1]["amount"], 20)


if __name__ == "__main__":
    unittest.main(exit=True)
