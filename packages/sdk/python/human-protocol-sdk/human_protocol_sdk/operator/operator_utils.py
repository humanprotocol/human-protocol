"""Utility helpers for operator-related queries.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

    print(
        OperatorUtils.get_operators(
            OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
        )
    )
    ```
"""

import logging
import os
from typing import List, Optional, Union

from human_protocol_sdk.constants import NETWORKS, ChainId, OrderDirection
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from web3 import Web3

LOG = logging.getLogger("human_protocol_sdk.operator")


class OperatorUtilsError(Exception):
    """Exception raised when errors occur during operator operations."""

    pass


class OperatorFilter:
    """Filter configuration for querying operators from the subgraph.

    Attributes:
        chain_id (ChainId): Chain ID to request data from.
        roles (List[str]): List of roles to filter by.
        min_staked_amount (Optional[int]): Minimum staked amount to include operators.
        order_by (Optional[str]): Property to order results by (e.g., "role", "stakedAmount").
        order_direction (OrderDirection): Order direction (ascending or descending).
        first (int): Number of items per page (1-1000).
        skip (int): Number of items to skip for pagination.
    """

    def __init__(
        self,
        chain_id: ChainId,
        roles: Optional[str] = [],
        min_staked_amount: int = None,
        order_by: Optional[str] = None,
        order_direction: OrderDirection = OrderDirection.DESC,
        first: int = 10,
        skip: int = 0,
    ):
        """Configure filtering options for operator queries.

        Args:
            chain_id: Chain ID to request data.
            roles: Roles to filter by.
            min_staked_amount: Minimum amount staked to include.
            order_by: Property to order by, e.g., "role".
            order_direction: Order direction of results.
            first: Number of items per page.
            skip: Number of items to skip (for pagination).

        Raises:
            OperatorUtilsError: If chain ID or order direction is invalid.
        """

        if chain_id not in ChainId:
            raise OperatorUtilsError("Invalid ChainId")

        if order_direction.value not in set(
            order_direction.value for order_direction in OrderDirection
        ):
            raise OperatorUtilsError("Invalid order direction")

        self.chain_id = chain_id
        self.roles = roles
        self.min_staked_amount = min_staked_amount
        self.order_by = order_by
        self.order_direction = order_direction
        self.first = min(max(first, 1), 1000)
        self.skip = max(skip, 0)


class OperatorData:
    """Represents operator information retrieved from the subgraph.

    Attributes:
        chain_id (ChainId): Chain where the operator is registered.
        id (str): Unique operator identifier.
        address (str): Operator's Ethereum address.
        staked_amount (Optional[int]): Amount staked by the operator.
        locked_amount (Optional[int]): Amount currently locked.
        locked_until_timestamp (Optional[int]): Time in milliseconds until locked amount is released.
        withdrawn_amount (Optional[int]): Total amount withdrawn.
        slashed_amount (Optional[int]): Total amount slashed.
        amount_jobs_processed (int): Number of jobs launched/processed by the operator.
        role (Optional[str]): Current role of the operator (e.g., "Job Launcher", "Recording Oracle").
        fee (Optional[int]): Operator fee percentage.
        public_key (Optional[str]): Operator's public key.
        webhook_url (Optional[str]): Webhook URL for notifications.
        website (Optional[str]): Operator's website URL.
        url (Optional[str]): Operator URL.
        job_types (List[str]): List of supported job types.
        registration_needed (Optional[bool]): Whether registration is required.
        registration_instructions (Optional[str]): Instructions for registration.
        reputation_networks (List[str]): List of reputation network addresses.
        name (Optional[str]): Operator name.
        category (Optional[str]): Operator category.
    """

    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_jobs_processed: str,
        reputation_networks: Union[List[str], str],
        staked_amount: Optional[str] = None,
        locked_amount: Optional[str] = None,
        locked_until_timestamp: Optional[str] = None,
        withdrawn_amount: Optional[str] = None,
        slashed_amount: Optional[str] = None,
        role: Optional[str] = None,
        fee: Optional[str] = None,
        public_key: Optional[str] = None,
        webhook_url: Optional[str] = None,
        website: Optional[str] = None,
        url: Optional[str] = None,
        job_types: Optional[Union[List[str], str]] = None,
        registration_needed: Optional[bool] = None,
        registration_instructions: Optional[str] = None,
        name: Optional[str] = None,
        category: Optional[str] = None,
    ):
        """Represents operator information returned from the subgraph.

        Args:
            chain_id: Chain identifier.
            id: Operator ID.
            address: Operator address.
            amount_jobs_processed: Jobs launched by the operator.
            reputation_networks: List of reputation networks.
            staked_amount: Amount staked.
            locked_amount: Amount locked.
            locked_until_timestamp: Time (in seconds) until locked amount is released.
            withdrawn_amount: Amount withdrawn.
            slashed_amount: Amount slashed.
            role: Current role of the operator.
            fee: Operator fee.
            public_key: Public key.
            webhook_url: Webhook URL.
            website: Website URL.
            url: Operator URL.
            job_types: Supported job types.
            registration_needed: Whether registration is needed.
            registration_instructions: Registration instructions.
            name: Operator name.
            category: Operator category.
        """

        self.chain_id = chain_id
        self.id = id
        self.address = address
        self.staked_amount = int(staked_amount) if staked_amount is not None else None
        self.locked_amount = int(locked_amount) if locked_amount is not None else None
        self.locked_until_timestamp = (
            int(locked_until_timestamp) * 1000
            if locked_until_timestamp is not None
            else None
        )
        self.withdrawn_amount = (
            int(withdrawn_amount) if withdrawn_amount is not None else None
        )
        self.slashed_amount = (
            int(slashed_amount) if slashed_amount is not None else None
        )
        self.amount_jobs_processed = int(amount_jobs_processed)
        self.role = role
        self.fee = int(fee) if fee is not None else None
        self.public_key = public_key
        self.webhook_url = webhook_url
        self.website = website
        self.url = url
        self.registration_needed = registration_needed
        self.registration_instructions = registration_instructions
        vals = reputation_networks if isinstance(reputation_networks, list) else []
        self.reputation_networks = [
            (rn if isinstance(rn, str) else rn.get("address"))
            for rn in vals
            if (isinstance(rn, str) and rn)
            or (isinstance(rn, dict) and rn.get("address"))
        ]
        self.name = name
        self.category = category
        self.job_types = (
            job_types.split(",")
            if isinstance(job_types, str)
            else (job_types if isinstance(job_types, list) else [])
        )


class RewardData:
    """Represents a reward distributed to a slasher.

    Attributes:
        escrow_address (str): Address of the escrow that generated the reward.
        amount (int): Reward amount in token's smallest unit.
    """

    def __init__(
        self,
        escrow_address: str,
        amount: int,
    ):
        self.escrow_address = escrow_address
        self.amount = amount


class OperatorUtils:
    """Utility class providing operator-related query and data retrieval functions.

    This class offers static methods to fetch operator data, including filtered
    operator lists, individual operator details, reputation network operators,
    and reward information from the Human Protocol subgraph.
    """

    @staticmethod
    def get_operators(
        filter: OperatorFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[OperatorData]:
        """Retrieve a list of operators matching the provided filter criteria.

        Queries the subgraph for operators that match the specified parameters
        including roles, minimum staked amount, and ordering preferences.

        Args:
            filter (OperatorFilter): Filter parameters including chain ID, roles,
                minimum staked amount, ordering, and pagination options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests
                such as custom endpoints or timeout settings.

        Returns:
            A list of operator records matching the filter criteria.
                Returns an empty list if no matches are found.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

            operators = OperatorUtils.get_operators(
                OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
            )
            for operator in operators:
                print(f"{operator.address}: {operator.role}")
            ```
        """

        from human_protocol_sdk.gql.operator import get_operators_query

        operators = []
        network = NETWORKS[filter.chain_id]

        if not network.get("subgraph_url"):
            return []

        operators_data = custom_gql_fetch(
            network,
            query=get_operators_query(filter),
            params={
                "minStakedAmount": filter.min_staked_amount,
                "roles": filter.roles,
                "orderBy": filter.order_by,
                "orderDirection": filter.order_direction.value,
                "first": filter.first,
                "skip": filter.skip,
            },
            options=options,
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
            staker = operator.get("staker") or {}
            operators.append(
                OperatorData(
                    chain_id=filter.chain_id,
                    id=operator.get("id"),
                    address=operator.get("address"),
                    staked_amount=staker.get("stakedAmount"),
                    locked_amount=staker.get("lockedAmount"),
                    locked_until_timestamp=staker.get("lockedUntilTimestamp"),
                    withdrawn_amount=staker.get("withdrawnAmount"),
                    slashed_amount=staker.get("slashedAmount"),
                    amount_jobs_processed=operator.get("amountJobsProcessed"),
                    role=operator.get("role"),
                    fee=operator.get("fee"),
                    public_key=operator.get("publicKey"),
                    webhook_url=operator.get("webhookUrl"),
                    website=operator.get("website"),
                    url=operator.get("url"),
                    job_types=operator.get("jobTypes"),
                    registration_needed=operator.get("registrationNeeded"),
                    registration_instructions=operator.get("registrationInstructions"),
                    reputation_networks=operator.get("reputationNetworks"),
                    name=operator.get("name"),
                    category=operator.get("category"),
                )
            )

        return operators

    @staticmethod
    def get_operator(
        chain_id: ChainId,
        operator_address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[OperatorData]:
        """Retrieve a single operator by their address.

        Fetches detailed information about a specific operator from the subgraph.

        Args:
            chain_id (ChainId): Network where the operator is registered.
            operator_address (str): Ethereum address of the operator.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Operator data if found, otherwise ``None``.

        Raises:
            OperatorUtilsError: If the chain ID is invalid or the operator address is malformed.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.operator import OperatorUtils

            chain_id = ChainId.POLYGON_AMOY
            operator_address = "0x62dD51230A30401C455c8398d06F85e4EaB6309f"

            operator_data = OperatorUtils.get_operator(chain_id, operator_address)
            if operator_data:
                print(f"Role: {operator_data.role}")
                print(f"Staked: {operator_data.staked_amount}")
            ```
        """

        from human_protocol_sdk.gql.operator import get_operator_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(operator_address):
            raise OperatorUtilsError(f"Invalid operator address: {operator_address}")

        network = NETWORKS[chain_id]

        operator_data = custom_gql_fetch(
            network,
            query=get_operator_query,
            params={"address": operator_address.lower()},
            options=options,
        )

        if (
            not operator_data
            or "data" not in operator_data
            or "operator" not in operator_data["data"]
            or not operator_data["data"]["operator"]
        ):
            return None

        operator = operator_data["data"]["operator"]
        staker = operator.get("staker") or {}
        return OperatorData(
            chain_id=chain_id,
            id=operator.get("id"),
            address=operator.get("address"),
            staked_amount=staker.get("stakedAmount"),
            locked_amount=staker.get("lockedAmount"),
            locked_until_timestamp=staker.get("lockedUntilTimestamp"),
            withdrawn_amount=staker.get("withdrawnAmount"),
            slashed_amount=staker.get("slashedAmount"),
            amount_jobs_processed=operator.get("amountJobsProcessed"),
            role=operator.get("role"),
            fee=operator.get("fee"),
            public_key=operator.get("publicKey"),
            webhook_url=operator.get("webhookUrl"),
            website=operator.get("website"),
            url=operator.get("url"),
            job_types=operator.get("jobTypes"),
            registration_needed=operator.get("registrationNeeded"),
            registration_instructions=operator.get("registrationInstructions"),
            reputation_networks=operator.get("reputationNetworks"),
            name=operator.get("name"),
            category=operator.get("category"),
        )

    @staticmethod
    def get_reputation_network_operators(
        chain_id: ChainId,
        address: str,
        role: Optional[str] = None,
        options: Optional[SubgraphOptions] = None,
    ) -> List[OperatorData]:
        """Retrieve operators registered under a specific reputation network.

        Fetches all operators associated with a reputation oracle, optionally
        filtered by role.

        Args:
            chain_id (ChainId): Network where the reputation network exists.
            address (str): Ethereum address of the reputation oracle.
            role (Optional[str]): Optional role to filter operators (e.g., "Job Launcher").
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of operators registered under the reputation network.
                Returns an empty list if no operators are found.

        Raises:
            OperatorUtilsError: If the chain ID is invalid or the reputation address is malformed.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.operator import OperatorUtils

            operators = OperatorUtils.get_reputation_network_operators(
                ChainId.POLYGON_AMOY,
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                role="Recording Oracle",
            )
            print(f"Found {len(operators)} operators")
            ```
        """

        from human_protocol_sdk.gql.operator import get_reputation_network_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(address):
            raise OperatorUtilsError(f"Invalid reputation address: {address}")

        network = NETWORKS[chain_id]

        reputation_network_data = custom_gql_fetch(
            network,
            query=get_reputation_network_query(role),
            params={"address": address.lower(), "role": role},
            options=options,
        )

        if (
            not reputation_network_data
            or "data" not in reputation_network_data
            or "reputationNetwork" not in reputation_network_data["data"]
            or not reputation_network_data["data"]["reputationNetwork"]
        ):
            return []

        operators = reputation_network_data["data"]["reputationNetwork"]["operators"]
        result: List[OperatorData] = []
        for operator in operators:
            staker = operator.get("staker") or {}
            result.append(
                OperatorData(
                    chain_id=chain_id,
                    id=operator.get("id"),
                    address=operator.get("address"),
                    staked_amount=staker.get("stakedAmount"),
                    locked_amount=staker.get("lockedAmount"),
                    locked_until_timestamp=staker.get("lockedUntilTimestamp"),
                    withdrawn_amount=staker.get("withdrawnAmount"),
                    slashed_amount=staker.get("slashedAmount"),
                    amount_jobs_processed=operator.get("amountJobsProcessed"),
                    role=operator.get("role"),
                    fee=operator.get("fee"),
                    public_key=operator.get("publicKey"),
                    webhook_url=operator.get("webhookUrl"),
                    website=operator.get("website"),
                    url=operator.get("url"),
                    job_types=operator.get("jobTypes"),
                    registration_needed=operator.get("registrationNeeded"),
                    registration_instructions=operator.get("registrationInstructions"),
                    reputation_networks=operator.get("reputationNetworks"),
                    name=operator.get("name"),
                    category=operator.get("category"),
                )
            )

        return result

    @staticmethod
    def get_rewards_info(
        chain_id: ChainId,
        slasher: str,
        options: Optional[SubgraphOptions] = None,
    ) -> List[RewardData]:
        """Retrieve rewards collected by a slasher address.

        Fetches all reward events where the specified address acted as a slasher
        and received rewards for detecting misbehavior.

        Args:
            chain_id (ChainId): Network where the slasher operates.
            slasher (str): Ethereum address of the slasher.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of rewards received by the slasher.
                Returns an empty list if no rewards are found.

        Raises:
            OperatorUtilsError: If the chain ID is invalid or the slasher address is malformed.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.operator import OperatorUtils

            rewards_info = OperatorUtils.get_rewards_info(
                ChainId.POLYGON_AMOY,
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
            )
            total_rewards = sum(reward.amount for reward in rewards_info)
            print(f"Total rewards: {total_rewards}")
            ```
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise OperatorUtilsError(f"Invalid ChainId")

        if not Web3.is_address(slasher):
            raise OperatorUtilsError(f"Invalid slasher address: {slasher}")

        network = NETWORKS[chain_id]

        reward_added_events_data = custom_gql_fetch(
            network,
            query=get_reward_added_events_query,
            params={"slasherAddress": slasher.lower()},
            options=options,
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
                escrow_address=reward_added_event.get("escrowAddress"),
                amount=int(reward_added_event.get("amount")),
            )
            for reward_added_event in reward_added_events
        ]
