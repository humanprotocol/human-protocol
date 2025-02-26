"""
Utility class for operator-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

    print(
        OperatorUtils.get_operators(
            OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
        )
    )

Module
------
"""

import logging
import os
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId, OrderDirection
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.utils import get_data_from_subgraph
from web3 import Web3

LOG = logging.getLogger("human_protocol_sdk.operator")


class OperatorUtilsError(Exception):
    """
    Raised when an error occurs while interacting with the operator.
    """

    pass


class OperatorFilter:
    """
    A class used to filter operators.
    """

    def __init__(
        self,
        chain_id: ChainId,
        roles: Optional[str] = [],
        min_amount_staked: int = None,
        order_by: Optional[str] = None,
        order_direction: OrderDirection = OrderDirection.DESC,
        first: int = 10,
        skip: int = 0,
    ):
        """
        Initializes a OperatorFilter instance.

        :param chain_id: Chain ID to request data
        :param roles: Roles to filter by
        :param min_amount_staked: Minimum amount staked to filter by
        :param order_by: Property to order by, e.g., "role"
        :param order_direction: Order direction of results, "asc" or "desc"
        :param first: Number of items per page
        :param skip: Number of items to skip (for pagination)
        """

        if chain_id not in ChainId:
            raise OperatorUtilsError("Invalid ChainId")

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise OperatorUtilsError("Invalid order direction")

        self.chain_id = chain_id
        self.roles = roles
        self.min_amount_staked = min_amount_staked
        self.order_by = order_by
        self.order_direction = order_direction
        self.first = min(max(first, 1), 1000)
        self.skip = max(skip, 0)


class OperatorData:
    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_staked: int,
        amount_locked: int,
        locked_until_timestamp: int,
        amount_withdrawn: int,
        amount_slashed: int,
        reward: int,
        amount_jobs_processed: int,
        role: Optional[str] = None,
        fee: Optional[int] = None,
        public_key: Optional[str] = None,
        webhook_url: Optional[str] = None,
        website: Optional[str] = None,
        url: Optional[str] = None,
        job_types: Optional[List[str]] = None,
        registration_needed: Optional[bool] = None,
        registration_instructions: Optional[str] = None,
        reputation_networks: Optional[List[str]] = None,
        name: Optional[str] = None,
        category: Optional[str] = None,
    ):
        """
        Initializes a OperatorData instance.

        :param chain_id: Chain Identifier
        :param id: Identifier
        :param address: Address
        :param amount_staked: Amount staked
        :param amount_locked: Amount locked
        :param locked_until_timestamp: Locked until timestamp
        :param amount_withdrawn: Amount withdrawn
        :param amount_slashed: Amount slashed
        :param reward: Reward
        :param amount_jobs_processed: Amount of jobs launched
        :param role: Role
        :param fee: Fee
        :param public_key: Public key
        :param webhook_url: Webhook URL
        :param website: Website URL
        :param url: URL
        :param job_types: Job types
        :param registration_needed: Whether registration is needed
        :param registration_instructions: Registration instructions
        :param reputation_networks: List of reputation networks
        :param name: Name
        :param category: Category
        """

        self.chain_id = chain_id
        self.id = id
        self.address = address
        self.amount_staked = amount_staked
        self.amount_locked = amount_locked
        self.locked_until_timestamp = locked_until_timestamp
        self.amount_withdrawn = amount_withdrawn
        self.amount_slashed = amount_slashed
        self.reward = reward
        self.amount_jobs_processed = amount_jobs_processed
        self.role = role
        self.fee = fee
        self.public_key = public_key
        self.webhook_url = webhook_url
        self.website = website
        self.url = url
        self.job_types = job_types
        self.registration_needed = registration_needed
        self.registration_instructions = registration_instructions
        self.reputation_networks = reputation_networks
        self.name = name
        self.category = category


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


class OperatorUtils:
    """
    A utility class that provides additional operator-related functionalities.
    """

    @staticmethod
    def get_operators(filter: OperatorFilter) -> List[OperatorData]:
        """Get operators data of the protocol.

        :param filter: Operator filter

        :return: List of operators data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

                print(
                    OperatorUtils.get_operators(
                        OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
                    )
                )
        """

        from human_protocol_sdk.gql.operator import get_operators_query

        operators = []
        network = NETWORKS[filter.chain_id]

        if not network.get("subgraph_url"):
            return []

        operators_data = get_data_from_subgraph(
            network,
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

        if (
            not operators_data
            or "data" not in operators_data
            or "operators" not in operators_data["data"]
            or not operators_data["data"]["operators"]
        ):
            return []

        operators_raw = operators_data["data"]["operators"]

        for operator in operators_raw:
            job_types = []
            reputation_networks = []

            if isinstance(operator.get("jobTypes"), str):
                job_types = operator["jobTypes"].split(",")
            elif isinstance(operator.get("jobTypes"), list):
                job_types = operator["jobTypes"]

            if operator.get("reputationNetworks") and isinstance(
                operator.get("reputationNetworks"), list
            ):
                reputation_networks = [
                    network["address"] for network in operator["reputationNetworks"]
                ]

            operators.append(
                OperatorData(
                    chain_id=filter.chain_id,
                    id=operator.get("id", ""),
                    address=operator.get("address", ""),
                    amount_staked=int(operator.get("amountStaked", 0)),
                    amount_locked=int(operator.get("amountLocked", 0)),
                    locked_until_timestamp=int(operator.get("lockedUntilTimestamp", 0)),
                    amount_withdrawn=int(operator.get("amountWithdrawn", 0)),
                    amount_slashed=int(operator.get("amountSlashed", 0)),
                    reward=int(operator.get("reward", 0)),
                    amount_jobs_processed=int(operator.get("amountJobsProcessed", 0)),
                    role=operator.get("role", None),
                    fee=int(operator.get("fee")) if operator.get("fee", None) else None,
                    public_key=operator.get("publicKey", None),
                    webhook_url=operator.get("webhookUrl", None),
                    website=operator.get("website", None),
                    url=operator.get("url", None),
                    job_types=(
                        operator.get("jobTypes").split(",")
                        if isinstance(operator.get("jobTypes"), str)
                        else (
                            operator.get("jobTypes", [])
                            if isinstance(operator.get("jobTypes"), list)
                            else []
                        )
                    ),
                    registration_needed=operator.get("registrationNeeded", None),
                    registration_instructions=operator.get(
                        "registrationInstructions", None
                    ),
                    reputation_networks=reputation_networks,
                    name=operator.get("name", None),
                    category=operator.get("category", None),
                )
            )

        return operators

    @staticmethod
    def get_operator(
        chain_id: ChainId,
        operator_address: str,
    ) -> Optional[OperatorData]:
        """Gets the operator details.

        :param chain_id: Network in which the operator exists
        :param operator_address: Address of the operator

        :return: Operator data if exists, otherwise None

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                chain_id = ChainId.POLYGON_AMOY
                operator_address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

                operator_data = OperatorUtils.get_operator(chain_id, operator_address)
                print(operator_data)
        """

        from human_protocol_sdk.gql.operator import get_operator_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(operator_address):
            raise OperatorUtilsError(f"Invalid operator address: {operator_address}")

        network = NETWORKS[chain_id]

        operator_data = get_data_from_subgraph(
            network,
            query=get_operator_query,
            params={"address": operator_address.lower()},
        )

        if (
            not operator_data
            or "data" not in operator_data
            or "operator" not in operator_data["data"]
            or not operator_data["data"]["operator"]
        ):
            return None

        operator = operator_data["data"]["operator"]

        job_types = []
        reputation_networks = []

        if isinstance(operator.get("jobTypes"), str):
            job_types = operator["jobTypes"].split(",")
        elif isinstance(operator.get("jobTypes"), list):
            job_types = operator["jobTypes"]

        if operator.get("reputationNetworks") and isinstance(
            operator.get("reputationNetworks"), list
        ):
            reputation_networks = [
                network["address"] for network in operator["reputationNetworks"]
            ]

        return OperatorData(
            chain_id=chain_id,
            id=operator.get("id", ""),
            address=operator.get("address", ""),
            amount_staked=int(operator.get("amountStaked", 0)),
            amount_locked=int(operator.get("amountLocked", 0)),
            locked_until_timestamp=int(operator.get("lockedUntilTimestamp", 0)),
            amount_withdrawn=int(operator.get("amountWithdrawn", 0)),
            amount_slashed=int(operator.get("amountSlashed", 0)),
            reward=int(operator.get("reward", 0)),
            amount_jobs_processed=int(operator.get("amountJobsProcessed", 0)),
            role=operator.get("role", None),
            fee=int(operator.get("fee")) if operator.get("fee", None) else None,
            public_key=operator.get("publicKey", None),
            webhook_url=operator.get("webhookUrl", None),
            website=operator.get("website", None),
            url=operator.get("url", None),
            job_types=(
                operator.get("jobTypes").split(",")
                if isinstance(operator.get("jobTypes"), str)
                else (
                    operator.get("jobTypes", [])
                    if isinstance(operator.get("jobTypes"), list)
                    else []
                )
            ),
            registration_needed=operator.get("registrationNeeded", None),
            registration_instructions=operator.get("registrationInstructions", None),
            reputation_networks=reputation_networks,
            name=operator.get("name", None),
            category=operator.get("category", None),
        )

    @staticmethod
    def get_reputation_network_operators(
        chain_id: ChainId,
        address: str,
        role: Optional[str] = None,
    ) -> List[OperatorData]:
        """Get the reputation network operators of the specified address.

        :param chain_id: Network in which the reputation network exists
        :param address: Address of the reputation oracle
        :param role: (Optional) Role of the operator

        :return: Returns an array of operator details

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                operators = OperatorUtils.get_reputation_network_operators(
                    ChainId.POLYGON_AMOY,
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
                print(operators)
        """

        from human_protocol_sdk.gql.operator import get_reputation_network_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(address):
            raise OperatorUtilsError(f"Invalid reputation address: {address}")

        network = NETWORKS[chain_id]

        reputation_network_data = get_data_from_subgraph(
            network,
            query=get_reputation_network_query(role),
            params={"address": address.lower(), "role": role},
        )

        if (
            not reputation_network_data
            or "data" not in reputation_network_data
            or "reputationNetwork" not in reputation_network_data["data"]
            or not reputation_network_data["data"]["reputationNetwork"]
        ):
            return []

        operators = reputation_network_data["data"]["reputationNetwork"]["operators"]
        return [
            OperatorData(
                chain_id=chain_id,
                id=operator.get("id", ""),
                address=operator.get("address", ""),
                amount_staked=int(operator.get("amountStaked", 0)),
                amount_locked=int(operator.get("amountLocked", 0)),
                locked_until_timestamp=int(operator.get("lockedUntilTimestamp", 0)),
                amount_withdrawn=int(operator.get("amountWithdrawn", 0)),
                amount_slashed=int(operator.get("amountSlashed", 0)),
                reward=int(operator.get("reward", 0)),
                amount_jobs_processed=int(operator.get("amountJobsProcessed", 0)),
                role=operator.get("role", None),
                fee=int(operator.get("fee")) if operator.get("fee", None) else None,
                public_key=operator.get("publicKey", None),
                webhook_url=operator.get("webhookUrl", None),
                website=operator.get("website", None),
                url=operator.get("url", None),
                job_types=(
                    operator.get("jobTypes").split(",")
                    if isinstance(operator.get("jobTypes"), str)
                    else (
                        operator.get("jobTypes", [])
                        if isinstance(operator.get("jobTypes"), list)
                        else []
                    )
                ),
                registration_needed=operator.get("registrationNeeded", None),
                registration_instructions=operator.get(
                    "registrationInstructions", None
                ),
                reputation_networks=(
                    [network["address"] for network in operator["reputationNetworks"]]
                    if operator.get("reputationNetworks")
                    and isinstance(operator.get("reputationNetworks"), list)
                    else []
                ),
                name=operator.get("name", None),
                category=operator.get("category", None),
            )
            for operator in operators
        ]

    @staticmethod
    def get_rewards_info(chain_id: ChainId, slasher: str) -> List[RewardData]:
        """Get rewards of the given slasher.

        :param chain_id: Network in which the slasher exists
        :param slasher: Address of the slasher

        :return: List of rewards info

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.operator import OperatorUtils

                rewards_info = OperatorUtils.get_rewards_info(
                    ChainId.POLYGON_AMOY,
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
                print(rewards_info)
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(slasher):
            raise OperatorUtilsError(f"Invalid slasher address: {slasher}")

        network = NETWORKS[chain_id]

        reward_added_events_data = get_data_from_subgraph(
            network,
            query=get_reward_added_events_query,
            params={"slasherAddress": slasher.lower()},
        )

        if (
            not reward_added_events_data
            or "data" not in reward_added_events_data
            or "rewardAddedEvents" not in reward_added_events_data["data"]
            or not reward_added_events_data["data"]["rewardAddedEvents"]
        ):
            return []

        reward_added_events = reward_added_events_data["data"]["rewardAddedEvents"]

        return [
            RewardData(
                escrow_address=reward_added_event.get("escrowAddress", ""),
                amount=int(reward_added_event.get("amount", 0)),
            )
            for reward_added_event in reward_added_events
        ]
