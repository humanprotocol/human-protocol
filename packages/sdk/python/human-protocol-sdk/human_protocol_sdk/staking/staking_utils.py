"""
Utility class for staking-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.staking.staking_utils import StakingUtils, StakersFilter

    stakers = StakingUtils.get_stakers(
        StakersFilter(
            chain_id=ChainId.POLYGON_AMOY,
            min_staked_amount="1000000000000000000",
            max_locked_amount="5000000000000000000",
            order_by="withdrawnAmount",
            order_direction="asc",
            first=5,
            skip=0,
        )
    )
    print("Filtered stakers:", stakers)

Module
------

"""

from typing import List, Optional
from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.filter import StakersFilter
from human_protocol_sdk.utils import get_data_from_subgraph
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
        self.id = id
        self.address = address
        self.staked_amount = int(staked_amount)
        self.locked_amount = int(locked_amount)
        self.withdrawn_amount = int(withdrawn_amount)
        self.slashed_amount = int(slashed_amount)
        self.locked_until_timestamp = int(locked_until_timestamp) * 1000
        self.last_deposit_timestamp = int(last_deposit_timestamp) * 1000


class StakingUtilsError(Exception):
    pass


class StakingUtils:
    @staticmethod
    def get_staker(chain_id: ChainId, address: str) -> Optional[StakerData]:
        network = NETWORKS.get(chain_id)
        if not network:
            raise StakingUtilsError("Unsupported Chain ID")

        data = get_data_from_subgraph(
            network,
            query=get_staker_query(),
            params={"id": address.lower()},
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
    def get_stakers(filter: StakersFilter) -> List[StakerData]:
        network_data = NETWORKS.get(filter.chain_id)
        if not network_data:
            raise StakingUtilsError("Unsupported Chain ID")

        data = get_data_from_subgraph(
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
