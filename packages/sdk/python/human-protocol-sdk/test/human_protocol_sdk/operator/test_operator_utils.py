import unittest
from test.human_protocol_sdk.utils import DEFAULT_GAS_PAYER
from unittest.mock import MagicMock, patch

from human_protocol_sdk.constants import NETWORKS, ChainId, Role
from human_protocol_sdk.gql.operator import (
    get_operator_query,
    get_operators_query,
    get_reputation_network_query,
)
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.operator import OperatorFilter, OperatorUtils


class TestOperatorUtils(unittest.TestCase):
    def test_get_operators(self):
        filter = OperatorFilter(chain_id=ChainId.POLYGON, roles=[Role.exchange_oracle])
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operators": [
                            {
                                "id": DEFAULT_GAS_PAYER,
                                "address": DEFAULT_GAS_PAYER,
                                "amountStaked": "100",
                                "amountLocked": "25",
                                "lockedUntilTimestamp": "0",
                                "amountWithdrawn": "25",
                                "amountSlashed": "25",
                                "reward": "25",
                                "amountJobsProcessed": "25",
                                "role": "role",
                                "fee": None,
                                "publicKey": None,
                                "webhookUrl": None,
                                "website": None,
                                "url": None,
                                "jobTypes": "type1,type2",
                                "registrationNeeded": True,
                                "registrationInstructions": "www.google.com",
                                "reputationNetworks": [{"address": "0x01"}],
                                "name": "Alice",
                                "category": "machine_learning",
                            }
                        ],
                    }
                }
            ]

            operators = OperatorUtils.get_operators(filter)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operators_query(filter),
                params={
                    "minAmountStaked": filter.min_amount_staked,
                    "roles": filter.roles,
                    "orderBy": filter.order_by,
                    "orderDirection": filter.order_direction.value,
                    "first": filter.first,
                    "skip": filter.skip,
                },
            )

            self.assertEqual(len(operators), 1)
            self.assertEqual(operators[0].id, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].address, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].amount_staked, 100)
            self.assertEqual(operators[0].amount_locked, 25)
            self.assertEqual(operators[0].locked_until_timestamp, 0)
            self.assertEqual(operators[0].amount_withdrawn, 25)
            self.assertEqual(operators[0].amount_slashed, 25)
            self.assertEqual(operators[0].reward, 25)
            self.assertEqual(operators[0].amount_jobs_processed, 25)
            self.assertEqual(operators[0].role, "role")
            self.assertEqual(operators[0].fee, None)
            self.assertEqual(operators[0].public_key, None)
            self.assertEqual(operators[0].webhook_url, None)
            self.assertEqual(operators[0].website, None)
            self.assertEqual(operators[0].url, None)
            self.assertEqual(operators[0].job_types, ["type1", "type2"])
            self.assertEqual(operators[0].registration_needed, True)
            self.assertEqual(operators[0].registration_instructions, "www.google.com")
            self.assertEqual(operators[0].reputation_networks, ["0x01"])
            self.assertEqual(operators[0].name, "Alice")
            self.assertEqual(operators[0].category, "machine_learning")

    def test_get_operators_when_job_types_is_none(self):
        filter = OperatorFilter(chain_id=ChainId.POLYGON, roles=[Role.exchange_oracle])
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operators": [
                            {
                                "id": DEFAULT_GAS_PAYER,
                                "address": DEFAULT_GAS_PAYER,
                                "amountStaked": "100",
                                "amountLocked": "25",
                                "lockedUntilTimestamp": "0",
                                "amountWithdrawn": "25",
                                "amountSlashed": "25",
                                "reward": "25",
                                "amountJobsProcessed": "25",
                                "role": "role",
                                "fee": None,
                                "publicKey": None,
                                "webhookUrl": None,
                                "website": None,
                                "url": None,
                                "jobTypes": None,
                                "reputationNetworks": [{"address": "0x01"}],
                                "name": "Alice",
                                "category": "machine_learning",
                            }
                        ],
                    }
                }
            ]

            operators = OperatorUtils.get_operators(filter)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operators_query(filter),
                params={
                    "minAmountStaked": filter.min_amount_staked,
                    "roles": filter.roles,
                    "orderBy": filter.order_by,
                    "orderDirection": filter.order_direction.value,
                    "first": filter.first,
                    "skip": filter.skip,
                },
            )

            self.assertEqual(len(operators), 1)
            self.assertEqual(operators[0].id, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].address, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].amount_staked, 100)
            self.assertEqual(operators[0].amount_locked, 25)
            self.assertEqual(operators[0].locked_until_timestamp, 0)
            self.assertEqual(operators[0].amount_withdrawn, 25)
            self.assertEqual(operators[0].amount_slashed, 25)
            self.assertEqual(operators[0].reward, 25)
            self.assertEqual(operators[0].amount_jobs_processed, 25)
            self.assertEqual(operators[0].role, "role")
            self.assertEqual(operators[0].fee, None)
            self.assertEqual(operators[0].public_key, None)
            self.assertEqual(operators[0].webhook_url, None)
            self.assertEqual(operators[0].website, None)
            self.assertEqual(operators[0].url, None)
            self.assertEqual(operators[0].registration_needed, None)
            self.assertEqual(operators[0].registration_instructions, None)
            self.assertEqual(operators[0].job_types, [])
            self.assertEqual(operators[0].reputation_networks, ["0x01"])
            self.assertEqual(operators[0].name, "Alice")
            self.assertEqual(operators[0].category, "machine_learning")

    def test_get_operators_when_job_types_is_array(self):
        filter = OperatorFilter(chain_id=ChainId.POLYGON, roles=[Role.exchange_oracle])
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operators": [
                            {
                                "id": DEFAULT_GAS_PAYER,
                                "address": DEFAULT_GAS_PAYER,
                                "amountStaked": "100",
                                "amountLocked": "25",
                                "lockedUntilTimestamp": "0",
                                "amountWithdrawn": "25",
                                "amountSlashed": "25",
                                "reward": "25",
                                "amountJobsProcessed": "25",
                                "role": "role",
                                "fee": None,
                                "publicKey": None,
                                "webhookUrl": None,
                                "website": None,
                                "url": None,
                                "jobTypes": ["type1", "type2", "type3"],
                                "reputationNetworks": [{"address": "0x01"}],
                                "name": "Alice",
                                "category": "machine_learning",
                            }
                        ],
                    }
                }
            ]

            operators = OperatorUtils.get_operators(filter)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operators_query(filter),
                params={
                    "minAmountStaked": filter.min_amount_staked,
                    "roles": filter.roles,
                    "orderBy": filter.order_by,
                    "orderDirection": filter.order_direction.value,
                    "first": filter.first,
                    "skip": filter.skip,
                },
            )

            self.assertEqual(len(operators), 1)
            self.assertEqual(operators[0].id, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].address, DEFAULT_GAS_PAYER)
            self.assertEqual(operators[0].amount_staked, 100)
            self.assertEqual(operators[0].amount_locked, 25)
            self.assertEqual(operators[0].locked_until_timestamp, 0)
            self.assertEqual(operators[0].amount_withdrawn, 25)
            self.assertEqual(operators[0].amount_slashed, 25)
            self.assertEqual(operators[0].reward, 25)
            self.assertEqual(operators[0].amount_jobs_processed, 25)
            self.assertEqual(operators[0].role, "role")
            self.assertEqual(operators[0].fee, None)
            self.assertEqual(operators[0].public_key, None)
            self.assertEqual(operators[0].webhook_url, None)
            self.assertEqual(operators[0].website, None)
            self.assertEqual(operators[0].url, None)
            self.assertEqual(
                operators[0].job_types, ["type1", "type2", "type3"]
            )  # Should the same array
            self.assertEqual(operators[0].reputation_networks, ["0x01"])
            self.assertEqual(operators[0].name, "Alice")
            self.assertEqual(operators[0].category, "machine_learning")

    def test_get_operators_empty_data(self):
        filter = OperatorFilter(chain_id=ChainId.POLYGON, roles=[Role.exchange_oracle])
        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = [
                {
                    "data": {
                        "operators": None,
                    }
                }
            ]

            operators = OperatorUtils.get_operators(filter)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operators_query(filter),
                params={
                    "minAmountStaked": filter.min_amount_staked,
                    "roles": filter.roles,
                    "orderBy": filter.order_by,
                    "orderDirection": filter.order_direction.value,
                    "first": filter.first,
                    "skip": filter.skip,
                },
            )

            self.assertEqual(operators, [])

    def test_get_operator(self):
        staker_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operator": {
                            "id": staker_address,
                            "address": staker_address,
                            "amountStaked": "100",
                            "amountLocked": "25",
                            "lockedUntilTimestamp": "0",
                            "amountWithdrawn": "25",
                            "amountSlashed": "25",
                            "reward": "25",
                            "amountJobsProcessed": "25",
                            "role": "role",
                            "fee": None,
                            "publicKey": None,
                            "webhookUrl": None,
                            "website": None,
                            "url": None,
                            "jobTypes": "type1,type2",
                            "registrationNeeded": True,
                            "registrationInstructions": "www.google.com",
                            "reputationNetworks": [{"address": "0x01"}],
                            "name": "Alice",
                            "category": "machine_learning",
                        }
                    }
                }
            ]

            operator = OperatorUtils.get_operator(ChainId.POLYGON, staker_address)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operator_query,
                params={"address": staker_address},
            )

            self.assertNotEqual(operator, None)
            self.assertEqual(operator.id, staker_address)
            self.assertEqual(operator.address, staker_address)
            self.assertEqual(operator.amount_staked, 100)
            self.assertEqual(operator.amount_locked, 25)
            self.assertEqual(operator.locked_until_timestamp, 0)
            self.assertEqual(operator.amount_withdrawn, 25)
            self.assertEqual(operator.amount_slashed, 25)
            self.assertEqual(operator.reward, 25)
            self.assertEqual(operator.amount_jobs_processed, 25)
            self.assertEqual(operator.role, "role")
            self.assertEqual(operator.fee, None)
            self.assertEqual(operator.public_key, None)
            self.assertEqual(operator.webhook_url, None)
            self.assertEqual(operator.website, None)
            self.assertEqual(operator.url, None)
            self.assertEqual(operator.job_types, ["type1", "type2"])
            self.assertEqual(operator.registration_needed, True)
            self.assertEqual(operator.registration_instructions, "www.google.com")
            self.assertEqual(operator.reputation_networks, ["0x01"])
            self.assertEqual(operator.name, "Alice")
            self.assertEqual(operator.category, "machine_learning")

    def test_get_operator_when_job_types_is_none(self):
        staker_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operator": {
                            "id": staker_address,
                            "address": staker_address,
                            "amountStaked": "100",
                            "amountLocked": "25",
                            "lockedUntilTimestamp": "0",
                            "amountWithdrawn": "25",
                            "amountSlashed": "25",
                            "reward": "25",
                            "amountJobsProcessed": "25",
                            "role": "role",
                            "fee": None,
                            "publicKey": None,
                            "webhookUrl": None,
                            "website": None,
                            "url": None,
                            "jobTypes": None,
                            "reputationNetworks": [{"address": "0x01"}],
                            "name": "Alice",
                            "category": "machine_learning",
                        }
                    }
                }
            ]

            operator = OperatorUtils.get_operator(ChainId.POLYGON, staker_address)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operator_query,
                params={"address": staker_address},
            )

            self.assertNotEqual(operator, None)
            self.assertEqual(operator.id, staker_address)
            self.assertEqual(operator.address, staker_address)
            self.assertEqual(operator.amount_staked, 100)
            self.assertEqual(operator.amount_locked, 25)
            self.assertEqual(operator.locked_until_timestamp, 0)
            self.assertEqual(operator.amount_withdrawn, 25)
            self.assertEqual(operator.amount_slashed, 25)
            self.assertEqual(operator.reward, 25)
            self.assertEqual(operator.amount_jobs_processed, 25)
            self.assertEqual(operator.role, "role")
            self.assertEqual(operator.fee, None)
            self.assertEqual(operator.public_key, None)
            self.assertEqual(operator.webhook_url, None)
            self.assertEqual(operator.website, None)
            self.assertEqual(operator.url, None)
            self.assertEqual(operator.job_types, [])
            self.assertEqual(operator.registration_needed, None)
            self.assertEqual(operator.registration_instructions, None)
            self.assertEqual(operator.reputation_networks, ["0x01"])
            self.assertEqual(operator.name, "Alice")
            self.assertEqual(operator.category, "machine_learning")

    def test_get_operator_when_job_types_is_array(self):
        staker_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.side_effect = [
                {
                    "data": {
                        "operator": {
                            "id": staker_address,
                            "address": staker_address,
                            "amountStaked": "100",
                            "amountLocked": "25",
                            "lockedUntilTimestamp": "0",
                            "amountWithdrawn": "25",
                            "amountSlashed": "25",
                            "reward": "25",
                            "amountJobsProcessed": "25",
                            "role": "role",
                            "fee": None,
                            "publicKey": None,
                            "webhookUrl": None,
                            "website": None,
                            "url": None,
                            "jobTypes": ["type1", "type2", "type3"],
                            "reputationNetworks": [{"address": "0x01"}],
                            "name": "Alice",
                            "category": "machine_learning",
                        }
                    }
                }
            ]

            operator = OperatorUtils.get_operator(ChainId.POLYGON, staker_address)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operator_query,
                params={"address": staker_address},
            )

            self.assertNotEqual(operator, None)
            self.assertEqual(operator.id, staker_address)
            self.assertEqual(operator.address, staker_address)
            self.assertEqual(operator.amount_staked, 100)
            self.assertEqual(operator.amount_locked, 25)
            self.assertEqual(operator.locked_until_timestamp, 0)
            self.assertEqual(operator.amount_withdrawn, 25)
            self.assertEqual(operator.amount_slashed, 25)
            self.assertEqual(operator.reward, 25)
            self.assertEqual(operator.amount_jobs_processed, 25)
            self.assertEqual(operator.role, "role")
            self.assertEqual(operator.fee, None)
            self.assertEqual(operator.public_key, None)
            self.assertEqual(operator.webhook_url, None)
            self.assertEqual(operator.website, None)
            self.assertEqual(operator.url, None)
            self.assertEqual(operator.job_types, ["type1", "type2", "type3"])
            self.assertEqual(operator.reputation_networks, ["0x01"])
            self.assertEqual(operator.name, "Alice")
            self.assertEqual(operator.category, "machine_learning")

    def test_get_operator_empty_data(self):
        staker_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = [{"data": {"operator": None}}]

            operator = OperatorUtils.get_operator(ChainId.POLYGON, staker_address)

            mock_function.assert_any_call(
                NETWORKS[ChainId.POLYGON],
                query=get_operator_query,
                params={"address": staker_address},
            )

            self.assertEqual(operator, None)

    def test_get_reputation_network_operators(self):
        reputation_address = "0x1234567890123456789012345678901234567891"
        operator_address = "0x1234567890123456789012345678901234567891"
        role = "Job Launcher"
        url = "https://example.com"
        job_types = "type1,type2"

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
                            "operators": [
                                {
                                    "address": operator_address,
                                    "role": role,
                                    "url": url,
                                    "jobTypes": job_types,
                                    "registrationNeeded": True,
                                    "registrationInstructions": url,
                                }
                            ],
                        }
                    }
                }
            ]

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON, reputation_address
            )

        mock_function.assert_any_call(
            NETWORKS[ChainId.POLYGON],
            query=get_reputation_network_query(None),
            params={"address": reputation_address, "role": None},
        )

        self.assertNotEqual(operators, [])
        self.assertEqual(operators[0].address, operator_address)
        self.assertEqual(operators[0].role, role)
        self.assertEqual(operators[0].url, url)
        self.assertEqual(operators[0].job_types, ["type1", "type2"])
        self.assertEqual(operators[0].registration_needed, True)
        self.assertEqual(operators[0].registration_instructions, url)

    def test_get_reputation_network_operators_when_job_types_is_none(self):
        reputation_address = "0x1234567890123456789012345678901234567891"
        operator_address = "0x1234567890123456789012345678901234567891"
        role = "Job Launcher"
        url = "https://example.com"
        job_types = None

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
                            "operators": [
                                {
                                    "address": operator_address,
                                    "role": role,
                                    "url": url,
                                    "jobTypes": job_types,
                                    "registrationNeeded": True,
                                    "registrationInstructions": url,
                                }
                            ],
                        }
                    }
                }
            ]

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON, reputation_address
            )

        mock_function.assert_any_call(
            NETWORKS[ChainId.POLYGON],
            query=get_reputation_network_query(None),
            params={"address": reputation_address, "role": None},
        )

        self.assertNotEqual(operators, [])
        self.assertEqual(operators[0].address, operator_address)
        self.assertEqual(operators[0].role, role)
        self.assertEqual(operators[0].url, url)
        self.assertEqual(operators[0].job_types, [])
        self.assertEqual(operators[0].registration_needed, True)
        self.assertEqual(operators[0].registration_instructions, url)

    def test_get_reputation_network_operators_when_job_types_is_array(self):
        reputation_address = "0x1234567890123456789012345678901234567891"
        operator_address = "0x1234567890123456789012345678901234567891"
        role = "Job Launcher"
        url = "https://example.com"
        job_types = ["type1", "type2", "type3"]

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
                            "operators": [
                                {
                                    "address": operator_address,
                                    "role": role,
                                    "url": url,
                                    "jobTypes": job_types,
                                    "registrationNeeded": True,
                                    "registrationInstructions": url,
                                }
                            ],
                        }
                    }
                }
            ]

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON, reputation_address
            )

        mock_function.assert_any_call(
            NETWORKS[ChainId.POLYGON],
            query=get_reputation_network_query(None),
            params={"address": reputation_address, "role": None},
        )

        self.assertNotEqual(operators, [])
        self.assertEqual(operators[0].address, operator_address)
        self.assertEqual(operators[0].role, role)
        self.assertEqual(operators[0].url, url)
        self.assertEqual(operators[0].job_types, ["type1", "type2", "type3"])
        self.assertEqual(operators[0].registration_needed, True)
        self.assertEqual(operators[0].registration_instructions, url)

    def test_get_reputation_network_operators_empty_data(self):
        reputation_address = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()

        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = [{"data": {"reputationNetwork": None}}]

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON, reputation_address
            )

        mock_function.assert_any_call(
            NETWORKS[ChainId.POLYGON],
            query=get_reputation_network_query(None),
            params={"address": reputation_address, "role": None},
        )

        self.assertEqual(operators, [])

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
                NETWORKS[ChainId.POLYGON],
                query=get_reward_added_events_query,
                params={"slasherAddress": slasher},
            )

            self.assertEqual(len(rewards_info), 2)
            self.assertEqual(rewards_info[0].escrow_address.lower(), "escrow1")
            self.assertEqual(rewards_info[0].amount, 10)
            self.assertEqual(rewards_info[1].escrow_address.lower(), "escrow2")
            self.assertEqual(rewards_info[1].amount, 20)

    def test_get_rewards_info_empty_data(self):
        slasher = "0x1234567890123456789012345678901234567891"

        mock_function = MagicMock()
        with patch(
            "human_protocol_sdk.operator.operator_utils.get_data_from_subgraph"
        ) as mock_function:
            mock_function.return_value = {"data": {"rewardAddedEvents": None}}
            rewards_info = OperatorUtils.get_rewards_info(ChainId.POLYGON, slasher)

            mock_function.assert_called_once_with(
                NETWORKS[ChainId.POLYGON],
                query=get_reward_added_events_query,
                params={"slasherAddress": slasher},
            )

            self.assertEqual(rewards_info, [])


if __name__ == "__main__":
    unittest.main(exit=True)
