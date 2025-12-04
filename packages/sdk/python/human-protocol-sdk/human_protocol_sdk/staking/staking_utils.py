"""Utility helpers for staking-related operations."""

from typing import List, Optional
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.filter import StakersFilter
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch
from human_protocol_sdk.gql.staking import get_staker_query, get_stakers_query


class StakerData:
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
        """Represents staker data returned from the subgraph.

        Args:
            id: Staker ID.
            address: Staker address.
            staked_amount: Total staked amount.
            locked_amount: Locked amount.
            withdrawn_amount: Withdrawn amount.
            slashed_amount: Slashed amount.
            locked_until_timestamp: Time until locked amount is released (seconds).
            last_deposit_timestamp: Last deposit time (seconds).
        """
        self.id = id
        self.address = address
        self.staked_amount = int(staked_amount)
        self.locked_amount = int(locked_amount)
        self.withdrawn_amount = int(withdrawn_amount)
        self.slashed_amount = int(slashed_amount)
        self.locked_until_timestamp = int(locked_until_timestamp) * 1000
        self.last_deposit_timestamp = int(last_deposit_timestamp) * 1000


class StakingUtilsError(Exception):
    """Raised when staking utility operations fail."""


class StakingUtils:
    @staticmethod
    def get_staker(
        chain_id: ChainId,
        address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[StakerData]:
        """Get a single staker by address.

        Args:
            chain_id: Network to request data.
            address: Staker address.
            options: Optional config for subgraph requests.

        Returns:
            Staker data if found, otherwise ``None``.
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
        """List stakers matching the provided filter.

        Args:
            filter: Staker filter parameters.
            options: Optional config for subgraph requests.

        Returns:
            A list of staker records.
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
