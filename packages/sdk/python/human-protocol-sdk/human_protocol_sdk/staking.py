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

    def get_all_stakers_info(self) -> List[dict]:
        """Gets all stakers of the protocol

        Returns:
            List[dict]: List of stakers info
        """

        [
            stakers,
            staker_info,
        ] = self.staking_contract.functions.getListOfStakers().call()

        return [
            {
                "staker": stakers[i],
                "tokens_staked": staker_info[i][0],
                "tokens_allocated": staker_info[i][1],
                "tokens_locked": staker_info[i][2],
                "tokens_locked_until": staker_info[i][3],
            }
            for i in range(len(stakers))
        ]

    def get_staker_info(self, staker_address: Optional[str] = None) -> Optional[dict]:
        """Gets the staker info.

        Args:
            staker_address (Optional[str]): Address of the staker, defaults to the default account

        Returns:
            Optional[dict]: Staker info if staker exists, otherwise None
        """

        if not staker_address:
            staker_address = self.w3.eth.default_account

        [
            tokens_staked,
            tokens_allocated,
            tokens_locked,
            tokens_locked_until,
        ] = self.staking_contract.functions.getStaker(staker_address).call()

        if (
            tokens_staked == 0
            and tokens_allocated == 0
            and tokens_locked == 0
            and tokens_locked_until == 0
        ):
            return None

        return {
            "staker": staker_address,
            "tokens_staked": tokens_staked,
            "tokens_allocated": tokens_allocated,
            "tokens_locked": tokens_locked,
            "tokens_locked_until": tokens_locked_until,
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
