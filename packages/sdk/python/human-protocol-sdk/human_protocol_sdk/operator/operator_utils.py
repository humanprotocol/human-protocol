"""
Utility class for operator-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.operator import OperatorUtils, LeaderFilter

    print(
        OperatorUtils.get_leaders(
            LeaderFilter(networks=[ChainId.POLYGON_MUMBAI], role="Job Launcher")
        )
    )

Module
------
"""

import logging
import os
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.utils import get_data_from_subgraph
from web3 import Web3

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.operator")


class OperatorUtilsError(Exception):
    """
    Raises when some error happens when interacting with operator.
    """

    pass


class LeaderFilter:
    """
    A class used to filter leaders.
    """

    def __init__(
        self,
        networks: List[ChainId],
        role: Optional[str] = None,
    ):
        """
        Initializes a LeaderFilter instance.

        :param networks: Networks to request data
        :param role: Leader role
        """

        if not networks or any(
            network.value not in set(chain_id.value for chain_id in ChainId)
            for network in networks
        ):
            raise OperatorUtilsError(f"Invalid ChainId")

        self.networks = networks
        self.role = role


class LeaderData:
    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_staked: int,
        amount_allocated: int,
        amount_locked: int,
        locked_until_timestamp: int,
        amount_withdrawn: int,
        amount_slashed: int,
        reputation: int,
        reward: int,
        amount_jobs_launched: int,
        role: Optional[str] = None,
        fee: Optional[int] = None,
        public_key: Optional[str] = None,
        webhook_url: Optional[str] = None,
        url: Optional[str] = None,
    ):
        """
        Initializes an LeaderData instance.

        :param chain_id: Chain Identifier
        :param id: Identifier
        :param address: Address
        :param amount_staked: Amount staked
        :param amount_allocated: Amount allocated
        :param amount_locked: Amount locked
        :param locked_until_timestamp: Locked until timestamp
        :param amount_withdrawn: Amount withdrawn
        :param amount_slashed: Amount slashed
        :param reputation: Reputation
        :param reward: Reward
        :param amount_jobs_launched: Amount of jobs launched
        :param role: Role
        :param fee: Fee
        :param public_key: Public key
        :param webhook_url: Webhook url
        :param url: Url
        """

        self.chain_id = chain_id
        self.id = id
        self.address = address
        self.amount_staked = amount_staked
        self.amount_allocated = amount_allocated
        self.amount_locked = amount_locked
        self.locked_until_timestamp = locked_until_timestamp
        self.amount_withdrawn = amount_withdrawn
        self.amount_slashed = amount_slashed
        self.reputation = reputation
        self.reward = reward
        self.amount_jobs_launched = amount_jobs_launched
        self.role = role
        self.fee = fee
        self.public_key = public_key
        self.webhook_url = webhook_url
        self.url = url


class RewardData:
    def __init__(
        self,
        escrow_address: str,
        amount: int,
    ):
        """
        Initializes a RewardData instance.

        :param escrow_address: Escrow address
        :param amount: Amount
        """

        self.escrow_address = escrow_address
        self.amount = amount


class Operator:
    def __init__(
        self,
        address: str,
        role: str,
    ):
        """
        Initializes an Operator instance.

        :param address: Operator address
        :param role: Role of the operator
        """

        self.address = address
        self.role = role


class OperatorUtils:
    """
    A utility class that provides additional operator-related functionalities.
    """

    @staticmethod
    def get_leaders(
        filter: LeaderFilter = LeaderFilter(networks=[ChainId.POLYGON_MUMBAI]),
    ) -> List[LeaderData]:
        """Get leaders data of the protocol

        :param filter: Leader filter

        :return: List of leaders data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils, LeaderFilter

                print(
                    OperatorUtils.get_leaders(
                        LeaderFilter(networks=[ChainId.POLYGON_MUMBAI])
                    )
                )
        """

        from human_protocol_sdk.gql.operator import get_leaders_query

        leaders = []
        for chain_id in filter.networks:
            network = NETWORKS[chain_id]

            leaders_data = get_data_from_subgraph(
                network["subgraph_url"],
                query=get_leaders_query(filter),
                params={"role": filter.role},
            )
            leaders_raw = leaders_data["data"]["leaders"]

            leaders.extend(
                [
                    LeaderData(
                        chain_id=chain_id,
                        id=leader.get("id", ""),
                        address=leader.get("address", ""),
                        amount_staked=int(leader.get("amountStaked", 0)),
                        amount_allocated=int(leader.get("amountAllocated", 0)),
                        amount_locked=int(leader.get("amountLocked", 0)),
                        locked_until_timestamp=int(
                            leader.get("lockedUntilTimestamp", 0)
                        ),
                        amount_withdrawn=int(leader.get("amountWithdrawn", 0)),
                        amount_slashed=int(leader.get("amountSlashed", 0)),
                        reputation=int(leader.get("reputation", 0)),
                        reward=int(leader.get("reward", 0)),
                        amount_jobs_launched=int(leader.get("amountJobsLaunched", 0)),
                        role=leader.get("role", None),
                        fee=int(leader.get("fee")) if leader.get("fee", None) else None,
                        public_key=leader.get("publicKey", None),
                        webhook_url=leader.get("webhookUrl", None),
                        url=leader.get("url", None),
                    )
                    for leader in leaders_raw
                ]
            )

        return leaders

    @staticmethod
    def get_leader(
        chain_id: ChainId,
        leader_address: str,
    ) -> Optional[LeaderData]:
        """Get the leader details.

        :param chain_id: Network in which the leader exists
        :param leader_address: Address of the leader

        :return: Leader data if exists, otherwise None

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                leader = OperatorUtils.get_leader(
                    ChainId.POLYGON_MUMBAI,
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
        """

        from human_protocol_sdk.gql.operator import get_leader_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(leader_address):
            raise OperatorUtilsError(f"Invalid leader address: {leader_address}")

        network = NETWORKS[chain_id]

        leader_data = get_data_from_subgraph(
            network["subgraph_url"],
            query=get_leader_query,
            params={"address": leader_address},
        )
        leader = leader_data["data"]["leader"]

        if not leader:
            return None

        return LeaderData(
            chain_id=chain_id,
            id=leader.get("id", ""),
            address=leader.get("address", ""),
            amount_staked=int(leader.get("amountStaked", 0)),
            amount_allocated=int(leader.get("amountAllocated", 0)),
            amount_locked=int(leader.get("amountLocked", 0)),
            locked_until_timestamp=int(leader.get("lockedUntilTimestamp", 0)),
            amount_withdrawn=int(leader.get("amountWithdrawn", 0)),
            amount_slashed=int(leader.get("amountSlashed", 0)),
            reputation=int(leader.get("reputation", 0)),
            reward=int(leader.get("reward", 0)),
            amount_jobs_launched=int(leader.get("amountJobsLaunched", 0)),
            role=leader.get("role", None),
            fee=int(leader.get("fee")) if leader.get("fee", None) else None,
            public_key=leader.get("publicKey", None),
            webhook_url=leader.get("webhookUrl", None),
            url=leader.get("url", None),
        )

    @staticmethod
    def get_reputation_network_operators(
        chain_id: ChainId,
        address: str,
        role: Optional[str] = None,
    ) -> List[Operator]:
        """Get the reputation network operators of the specified address.

        :param chain_id: Network in which the reputation network exists
        :param address: Address of the reputation oracle
        :param role: (Optional) Role of the operator

        :return: Returns an array of operator details

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                leader = OperatorUtils.get_reputation_network_operators(
                    ChainId.POLYGON_MUMBAI,
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
        """

        from human_protocol_sdk.gql.operator import get_reputation_network_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(address):
            raise OperatorUtilsError(f"Invalid reputation address: {address}")

        network = NETWORKS[chain_id]

        reputation_network_data = get_data_from_subgraph(
            network["subgraph_url"],
            query=get_reputation_network_query(role),
            params={"address": address, "role": role},
        )
        operators = reputation_network_data["data"]["reputationNetwork"]["operators"]

        return [
            Operator(
                address=operator.get("address", ""),
                role=operator.get("role", ""),
            )
            for operator in operators
        ]

    @staticmethod
    def get_rewards_info(chain_id: ChainId, slasher: str) -> List[RewardData]:
        """Get rewards of the given slasher

        :param chain_id: Network in which the slasher exists
        :param slasher: Address of the slasher

        :return: List of rewards info

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                rewards_info = OperatorUtils.get_rewards_info(
                    ChainId.POLYGON_MUMBAI,
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(slasher):
            raise OperatorUtilsError(f"Invalid slasher address: {slasher}")

        network = NETWORKS[chain_id]

        reward_added_events_data = get_data_from_subgraph(
            network["subgraph_url"],
            query=get_reward_added_events_query,
            params={"slasherAddress": slasher.lower()},
        )
        reward_added_events = reward_added_events_data["data"]["rewardAddedEvents"]

        return [
            RewardData(
                escrow_address=reward_added_event.get("escrowAddress", ""),
                amount=int(reward_added_event.get("amount", 0)),
            )
            for reward_added_event in reward_added_events
        ]
