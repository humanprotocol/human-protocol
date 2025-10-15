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
        staked_amount: int,
        locked_amount: int,
        withdrawn_amount: int,
        slashed_amount: int,
        locked_until_timestamp: int,
        last_deposit_timestamp: int,
    ):
        self.id = id
        self.address = address
        self.staked_amount = staked_amount
        self.locked_amount = locked_amount
        self.withdrawn_amount = withdrawn_amount
        self.slashed_amount = slashed_amount
        self.locked_until_timestamp = locked_until_timestamp
        self.last_deposit_timestamp = last_deposit_timestamp


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
            id=staker.get("id", ""),
            address=staker.get("address", ""),
            staked_amount=int(staker.get("stakedAmount") or 0),
            locked_amount=int(staker.get("lockedAmount") or 0),
            withdrawn_amount=int(staker.get("withdrawnAmount") or 0),
            slashed_amount=int(staker.get("slashedAmount") or 0),
            locked_until_timestamp=int(staker.get("lockedUntilTimestamp") or 0),
            last_deposit_timestamp=int(staker.get("lastDepositTimestamp") or 0),
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
                id=staker.get("id", ""),
                address=staker.get("address", ""),
                staked_amount=int(staker.get("stakedAmount") or 0),
                locked_amount=int(staker.get("lockedAmount") or 0),
                withdrawn_amount=int(staker.get("withdrawnAmount") or 0),
                slashed_amount=int(staker.get("slashedAmount") or 0),
                locked_until_timestamp=int(staker.get("lockedUntilTimestamp") or 0),
                last_deposit_timestamp=int(staker.get("lastDepositTimestamp") or 0),
            )
            for staker in stakers_raw
        ]
