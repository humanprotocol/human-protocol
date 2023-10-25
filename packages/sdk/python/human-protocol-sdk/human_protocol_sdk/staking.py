#!/usr/bin/env python3

import logging
import os

from decimal import Decimal
from typing import List, Optional

import web3
from web3 import Web3
from web3.middleware import geth_poa_middleware

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.gql.reward import get_reward_added_events_query
from human_protocol_sdk.utils import (
    get_erc20_interface,
    get_factory_interface,
    get_staking_interface,
    get_reward_pool_interface,
    get_data_from_subgraph,
    handle_transaction,
)

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.staking")


class StakingClientError(Exception):
    """
    Raises when some error happens when interacting with staking.
    """

    pass


class AllocationData:
    def __init__(
        self,
        escrow_address: str,
        staker: str,
        tokens: str,
        created_at: str,
        closed_at: str,
    ):
        """
        Initializes an AllocationData instance.

        Args:
            escrow_address (str): Escrow address
            staker (str): Staker address
            tokens (str): Amount allocated
            created_at (str): Creation date
            closed_at (str): Closing date
        """

        self.escrow_address = escrow_address
        self.staker = staker
        self.tokens = tokens
        self.created_at = created_at
        self.closed_at = closed_at


class StakingClient:
    """
    A class used to manage staking, and allocation on the HUMAN network.
    """

    def __init__(self, w3: Web3):
        """Initializes a Staking instance

        Args:

        """

        # Initialize web3 instance
        self.w3 = w3
        if not self.w3.middleware_onion.get("geth_poa"):
            self.w3.middleware_onion.inject(geth_poa_middleware, "geth_poa", layer=0)

        chain_id = None
        # Load network configuration based on chain_id
        try:
            chain_id = self.w3.eth.chain_id
            self.network = NETWORKS[ChainId(chain_id)]
        except:
            if chain_id is not None:
                raise StakingClientError(f"Invalid ChainId: {chain_id}")
            else:
                raise StakingClientError(f"Invalid Web3 Instance")

        if not self.network:
            raise StakingClientError("Empty network configuration")

        # Initialize contract instances
        erc20_interface = get_erc20_interface()
        self.hmtoken_contract = self.w3.eth.contract(
            address=self.network["hmt_address"], abi=erc20_interface["abi"]
        )

        factory_interface = get_factory_interface()
        self.factory_contract = self.w3.eth.contract(
            address=self.network["factory_address"], abi=factory_interface["abi"]
        )

        staking_interface = get_staking_interface()
        self.staking_contract = self.w3.eth.contract(
            address=self.network["staking_address"], abi=staking_interface["abi"]
        )

        reward_pool_interface = get_reward_pool_interface()
        self.reward_pool_contract = self.w3.eth.contract(
            address=self.network["reward_pool_address"],
            abi=reward_pool_interface["abi"],
        )

    def approve_stake(self, amount: Decimal) -> None:
        """Approves HMT token for Staking.

        Args:
            amount (Decimal): Amount to approve

        Returns:
            None

        Validations:
            - Amount must be greater than 0
        """

        if amount <= 0:
            raise StakingClientError("Amount to approve must be greater than 0")

        handle_transaction(
            self.w3,
            "Approve stake",
            self.hmtoken_contract.functions.approve(
                self.network["staking_address"], amount
            ),
            StakingClientError,
        )

    def stake(self, amount: Decimal) -> None:
        """Stakes HMT token.

        Args:
            amount (Decimal): Amount to stake

        Returns:
            None

        Validations:
            - Amount must be greater than 0
            - Amount must be less than or equal to the approved amount (on-chain)
            - Amount must be less than or equal to the balance of the staker (on-chain)
        """

        if amount <= 0:
            raise StakingClientError("Amount to stake must be greater than 0")

        handle_transaction(
            self.w3,
            "Stake HMT",
            self.staking_contract.functions.stake(amount),
            StakingClientError,
        )

    def allocate(self, escrow_address: str, amount: Decimal) -> None:
        """Allocates HMT token to the escrow.

        Args:
            escrow_address (str): Address of the escrow
            amount (Decimal): Amount to allocate

        Returns:
            None

        Validations:
            - Amount must be greater than 0
            - Escrow address must be valid
            - Amount must be less than or equal to the staked amount (on-chain)
        """

        if amount <= 0:
            raise StakingClientError("Amount to allocate must be greater than 0")

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Allocate HMT",
            self.staking_contract.functions.allocate(escrow_address, amount),
            StakingClientError,
        )

    def close_allocation(self, escrow_address: str) -> None:
        """Closes allocated HMT token from the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            None

        Validations:
            - Escrow address must be valid
            - Escrow should be cancelled / completed (on-chain)
        """

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Close allocation",
            self.staking_contract.functions.closeAllocation(escrow_address),
            StakingClientError,
        )

    def unstake(self, amount: Decimal) -> None:
        """Unstakes HMT token.

        Args:
            amount (Decimal): Amount to unstake

        Returns:
            None

        Validations:
            - Amount must be greater than 0
            - Amount must be less than or equal to the staked amount which is not locked / allocated (on-chain)
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")

        handle_transaction(
            self.w3,
            "Unstake HMT",
            self.staking_contract.functions.unstake(amount),
            StakingClientError,
        )

    def withdraw(self) -> None:
        """Withdraws HMT token.

        Returns:
            None

        Validations:
            - There must be unstaked tokens which is unlocked (on-chain)
        """

        handle_transaction(
            self.w3,
            "Withdraw HMT",
            self.staking_contract.functions.withdraw(),
            StakingClientError,
        )

    def slash(
        self, slasher: str, staker: str, escrow_address: str, amount: Decimal
    ) -> None:
        """Slashes HMT token.

        Args:
            slasher (str): Address of the slasher
            staker (str): Address of the staker
            escrow_address (str): Address of the escrow
            amount (Decimal): Amount to slash

        Returns:
            None

        Validations:
            - Amount must be greater than 0
            - Amount must be less than or equal to the amount allocated to the escrow (on-chain)
            - Escrow address must be valid
        """

        if amount <= 0:
            raise StakingClientError("Amount to slash must be greater than 0")

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Slash HMT",
            self.staking_contract.functions.slash(
                slasher, staker, escrow_address, amount
            ),
            StakingClientError,
        )

    def distribute_reward(self, escrow_address: str) -> None:
        """Pays out rewards to the slashers for the specified escrow address.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            None

        Validations:
            - Escrow address must be valid
        """

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Distribute reward",
            self.reward_pool_contract.functions.distributeReward(escrow_address),
            StakingClientError,
        )

    def get_allocation(self, escrow_address: str) -> Optional[AllocationData]:
        """Gets the allocation info for the specified escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Optional[AllocationData]: Allocation info if escrow exists, otherwise None
        """

        [
            escrow_address,
            staker,
            tokens,
            created_at,
            closed_at,
        ] = self.staking_contract.functions.getAllocation(escrow_address).call()

        if escrow_address == web3.constants.ADDRESS_ZERO:
            return None

        return AllocationData(
            escrow_address=escrow_address,
            staker=staker,
            tokens=tokens,
            created_at=created_at,
            closed_at=closed_at,
        )

    def _is_valid_escrow(self, escrow_address: str) -> bool:
        """Checks if the escrow address is valid.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            bool: True if the escrow address is valid, False otherwise
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()


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

        Args:
            networks (List[ChainId]): Networks to request data
            role (Optional[str]): Leader role
        """

        if not networks or any(
            network.value not in set(chain_id.value for chain_id in ChainId)
            for network in networks
        ):
            raise StakingClientError(f"Invalid ChainId")

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

        Args:
            chain_id (ChainId): Chain Identifier
            id (str): Identifier
            address (str): Address
            amount_staked (int): Amount staked
            amount_allocated (int): Amount allocated
            amount_locked (int): Amount locked
            locked_until_timestamp (int): Locked until timestamp
            amount_withdrawn (int): Amount withdrawn
            amount_slashed (int): Amount slashed
            reputation (int): Reputation
            reward (int): Reward
            amount_jobs_launched (int): Amount of jobs launched
            role (Optional[str]): Role
            fee (Optional[int]): Fee
            public_key (Optional[str]): Public key
            webhook_url (Optional[str]): Webhook url
            url (Optional[str]): Url
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
        Initializes an RewardData instance.

        Args:
            escrow_address (str): Escrow address
            amount (int): Amount
        """

        self.escrow_address = escrow_address
        self.amount = amount


class StakingUtils:
    """
    A utility class that provides additional staking-related functionalities.
    """

    @staticmethod
    def get_leaders(
        filter: LeaderFilter = LeaderFilter(networks=[ChainId.POLYGON_MUMBAI]),
    ) -> List[LeaderData]:
        """Get leaders data of the protocol

        Returns:
            List[LeaderData]: List of leaders data
        """
        from human_protocol_sdk.gql.staking import get_leaders_query

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

        Args:
            chain_id (ChainId): Network in which the leader exists
            leader_address (str): Address of the leader

        Returns:
            Optional[LeaderData]: Leader data if exists, otherwise None
        """
        from human_protocol_sdk.gql.staking import get_leader_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise StakingClientError(f"Invalid ChainId")

        if not Web3.is_address(leader_address):
            raise StakingClientError(f"Invalid leader address: {leader_address}")

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
    def get_rewards_info(chain_id: ChainId, slasher: str) -> List[RewardData]:
        """Get rewards of the given slasher

        Args:
            chain_id (ChainId): Network in which the slasher exists
            slasher (str): Address of the slasher

        Returns:
            List[RewardData]: List of rewards info
        """

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise StakingClientError(f"Invalid ChainId")

        if not Web3.is_address(slasher):
            raise StakingClientError(f"Invalid slasher address: {slasher}")

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
