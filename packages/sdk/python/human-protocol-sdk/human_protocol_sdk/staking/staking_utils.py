"""Utility helpers for staking-related queries."""

from typing import List, Optional
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.filter import StakersFilter
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from human_protocol_sdk.gql.staking import get_staker_query, get_stakers_query


class StakerData:
    """Represents staker information retrieved from the subgraph.

    Attributes:
        id (str): Unique staker identifier.
        address (str): Staker's Ethereum address.
        staked_amount (int): Total amount staked in token's smallest unit.
        locked_amount (int): Amount currently locked.
        withdrawn_amount (int): Total amount withdrawn.
        slashed_amount (int): Total amount slashed.
        locked_until_timestamp (int): Time in milliseconds until locked amount is released.
        last_deposit_timestamp (int): Last deposit time in milliseconds.
    """

    def __init__(
        self,
        id: str,
        address: str,
        staked_amount: str,
        locked_amount: str,
        withdrawn_amount: str,
        slashed_amount: str,
        locked_until_timestamp: str,
        last_deposit_timestamp: str,
    ):
        self.id = id
        self.address = address
        self.staked_amount = int(staked_amount)
        self.locked_amount = int(locked_amount)
        self.withdrawn_amount = int(withdrawn_amount)
        self.slashed_amount = int(slashed_amount)
        self.locked_until_timestamp = int(locked_until_timestamp) * 1000
        self.last_deposit_timestamp = int(last_deposit_timestamp) * 1000


class StakingUtilsError(Exception):
    """Exception raised when staking utility operations fail."""


class StakingUtils:
    """Utility class providing staking-related query and data retrieval functions.

    This class offers static methods to fetch staker data from the Human Protocol
    subgraph, including individual staker details and filtered lists.
    """

    @staticmethod
    def get_staker(
        chain_id: ChainId,
        address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[StakerData]:
        """Retrieve a single staker by their address.

        Fetches detailed staking information for a specific address from the subgraph.

        Args:
            chain_id (ChainId): Network where the staker is registered.
            address (str): Ethereum address of the staker.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Staker data if found, otherwise ``None``.

        Raises:
            StakingUtilsError: If the chain ID is not supported.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.staking import StakingUtils

            staker = StakingUtils.get_staker(
                ChainId.POLYGON_AMOY,
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
            )
            if staker:
                print(f"Staked: {staker.staked_amount}")
                print(f"Locked: {staker.locked_amount}")
            ```
        """
        network = NETWORKS.get(chain_id)
        if not network:
            raise StakingUtilsError("Unsupported Chain ID")

        data = custom_gql_fetch(
            network,
            query=get_staker_query(),
            params={"id": address.lower()},
            options=options,
        )
        if (
            not data
            or "data" not in data
            or "staker" not in data["data"]
            or not data["data"]["staker"]
        ):
            return None

        staker = data["data"]["staker"]
        return StakerData(
            id=staker.get("id"),
            address=staker.get("address"),
            staked_amount=staker.get("stakedAmount"),
            locked_amount=staker.get("lockedAmount"),
            withdrawn_amount=staker.get("withdrawnAmount"),
            slashed_amount=staker.get("slashedAmount"),
            locked_until_timestamp=staker.get("lockedUntilTimestamp"),
            last_deposit_timestamp=staker.get("lastDepositTimestamp"),
        )

    @staticmethod
    def get_stakers(
        filter: StakersFilter,
        options: Optional[SubgraphOptions] = None,
    ) -> List[StakerData]:
        """Retrieve a list of stakers matching the provided filter criteria.

        Queries the subgraph for stakers that match the specified parameters including
        amount ranges, ordering, and pagination.

        Args:
            filter (StakersFilter): Filter parameters including chain ID, amount ranges
                (staked, locked, withdrawn, slashed), ordering, and pagination options.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            A list of staker records matching the filter criteria.
                Returns an empty list if no matches are found.

        Raises:
            StakingUtilsError: If the chain ID is not supported.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.staking import StakingUtils
            from human_protocol_sdk.filter import StakersFilter
            from web3 import Web3

            stakers = StakingUtils.get_stakers(
                StakersFilter(
                    chain_id=ChainId.POLYGON_AMOY,
                    min_staked_amount=Web3.to_wei(100, "ether"),
                )
            )
            for staker in stakers:
                print(f"{staker.address}: {staker.staked_amount}")
            ```
        """
        network_data = NETWORKS.get(filter.chain_id)
        if not network_data:
            raise StakingUtilsError("Unsupported Chain ID")

        data = custom_gql_fetch(
            network_data,
            query=get_stakers_query(filter),
            params={
                "minStakedAmount": filter.min_staked_amount,
                "maxStakedAmount": filter.max_staked_amount,
                "minLockedAmount": filter.min_locked_amount,
                "maxLockedAmount": filter.max_locked_amount,
                "minWithdrawnAmount": filter.min_withdrawn_amount,
                "maxWithdrawnAmount": filter.max_withdrawn_amount,
                "minSlashedAmount": filter.min_slashed_amount,
                "maxSlashedAmount": filter.max_slashed_amount,
                "orderBy": filter.order_by,
                "orderDirection": filter.order_direction.value,
                "first": filter.first,
                "skip": filter.skip,
            },
            options=options,
        )
        if (
            not data
            or "data" not in data
            or "stakers" not in data["data"]
            or not data["data"]["stakers"]
        ):
            return []

        stakers_raw = data["data"]["stakers"]
        return [
            StakerData(
                id=staker.get("id") or "",
                address=staker.get("address") or "",
                staked_amount=staker.get("stakedAmount"),
                locked_amount=staker.get("lockedAmount"),
                withdrawn_amount=staker.get("withdrawnAmount"),
                slashed_amount=staker.get("slashedAmount"),
                locked_until_timestamp=staker.get("lockedUntilTimestamp"),
                last_deposit_timestamp=staker.get("lastDepositTimestamp"),
            )
            for staker in stakers_raw
        ]
