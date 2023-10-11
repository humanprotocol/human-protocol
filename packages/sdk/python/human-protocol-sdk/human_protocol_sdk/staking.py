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


class LeaderFilter:
    """
    A class used to filter leaders.
    """

    def __init__(
        self,
        role: Optional[str] = None,
    ):
        """
        Initializes a LeaderFilter instance.

        Args:
            role (Optional[str]): Leader role
        """

        self.role = role


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

    def get_leaders(self, filter: LeaderFilter = LeaderFilter()) -> List[dict]:
        """Get leaders data of the protocol

        Returns:
            List[dict]: List of leaders data
        """
        from human_protocol_sdk.gql.staking import get_leaders_query

        leaders_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_leaders_query(filter),
            params={"role": filter.role},
        )
        leaders = leaders_data["data"]["leaders"]

        return [
            {
                "id": leader["id"],
                "address": leader["address"],
                "amount_staked": int(leader["amountStaked"]),
                "amount_allocated": int(leader["amountAllocated"]),
                "amount_locked": int(leader["amountLocked"]),
                "locked_until_timestamp": int(leader["lockedUntilTimestamp"]),
                "amount_withdrawn": int(leader["amountWithdrawn"]),
                "amount_slashed": int(leader["amountSlashed"]),
                "reputation": int(leader["reputation"]),
                "reward": int(leader["reward"]),
                "amount_jobs_launched": int(leader["amountJobsLaunched"]),
                "role": leader["role"],
                "fee": int(leader["fee"]) if leader["fee"] else None,
                "public_key": leader["publicKey"],
                "webhook_url": leader["webhookUrl"],
                "url": leader["url"],
            }
            for leader in leaders
        ]

    def get_leader(self, address: Optional[str] = None) -> dict:
        """Get the leader details.

        Args:
            address (Optional[str]): Address of the leader, defaults to the default account

        Returns:
            dict: Leader details
        """
        from human_protocol_sdk.gql.staking import get_leader_query

        if not address:
            if not self.w3.eth.default_account:
                raise StakingClientError("No address provided")

            address = self.w3.eth.default_account

        leader_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_leader_query,
            params={"address": address},
        )
        leader = leader_data["data"]["leader"]

        return {
            "id": leader["id"],
            "address": leader["address"],
            "amount_staked": int(leader["amountStaked"]),
            "amount_allocated": int(leader["amountAllocated"]),
            "amount_locked": int(leader["amountLocked"]),
            "locked_until_timestamp": int(leader["lockedUntilTimestamp"]),
            "amount_withdrawn": int(leader["amountWithdrawn"]),
            "amount_slashed": int(leader["amountSlashed"]),
            "reputation": int(leader["reputation"]),
            "reward": int(leader["reward"]),
            "amount_jobs_launched": int(leader["amountJobsLaunched"]),
            "role": leader["role"],
            "fee": int(leader["fee"]) if leader["fee"] else None,
            "public_key": leader["publicKey"],
            "webhook_url": leader["webhookUrl"],
            "url": leader["url"],
        }

    def get_allocation(self, escrow_address: str) -> Optional[dict]:
        """Gets the allocation info for the specified escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Optional[dict]: Allocation info if escrow exists, otherwise None
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

        return {
            "escrow_address": escrow_address,
            "staker": staker,
            "tokens": tokens,
            "created_at": created_at,
            "closed_at": closed_at,
        }

    def get_rewards_info(self, slasher: str) -> List[dict]:
        """Get rewards of the given slasher

        Args:
            slasher (str): Address of the slasher

        Returns:
            List[dict]: List of rewards info
        """

        reward_added_events_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_reward_added_events_query,
            params={"slasherAddress": slasher},
        )
        reward_added_events = reward_added_events_data["data"]["rewardAddedEvents"]

        return [
            {
                "escrow_address": reward_added_events[i]["escrowAddress"],
                "amount": reward_added_events[i]["amount"],
            }
            for i in range(len(reward_added_events))
        ]

    def _is_valid_escrow(self, escrow_address: str) -> bool:
        """Checks if the escrow address is valid.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            bool: True if the escrow address is valid, False otherwise
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()
