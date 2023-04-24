#!/usr/bin/env python3

import logging
import os

from decimal import Decimal
from typing import Optional

from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware, geth_poa_middleware
from web3.providers.rpc import HTTPProvider

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.utils import (
    get_hmtoken_interface,
    get_factory_interface,
    get_staking_interface,
    get_reward_pool_interface,
)

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.staking")


class StakingClientError(Exception):
    """Raises when some error happens when interacting with staking."""

    """
    Raises when some error happens when interacting with staking.
    """

    pass


class StakingClient:
    """A class used to manage staking, and allocation on the HUMAN network.

    Args:
        staking_addr (str): The address of staking contract

    Attributes:


    """

    def __init__(self, chain_id: ChainId, provider: HTTPProvider, priv_key: str):
        """Initializes a Staking instance

        Args:

        """

        # Load network configuration based on chain id
        self.network = NETWORKS[chain_id]

        if not self.network:
            raise StakingClientError("Invalid chain id")

        # Initialize web3 instance
        self.w3 = Web3(provider)
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(priv_key)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer)
        )
        self.w3.eth.default_account = self.gas_payer.address

        # Initialize contract instances
        hmtoken_interface = get_hmtoken_interface()
        self.hmtoken_contract = self.w3.eth.contract(
            address=self.network["hmt_address"], abi=hmtoken_interface["abi"]
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

    def approve_stake(self, amount: Decimal):
        """Approves HMT token for Staking.

        Args:
            amount (Decimal): Amount to approve

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to approve must be greater than 0")

        self._handle_transaction(
            "Approve stake",
            self.hmtoken_contract.functions.approve(
                self.network["staking_address"], amount
            ),
        )

    def stake(self, amount: Decimal):
        """Stakes HMT token.

        Args:
            amount (Decimal): Amount to stake

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to stake must be greater than 0")

        self._handle_transaction(
            "Stake HMT", self.staking_contract.functions.stake(amount)
        )

    def allocate(self, escrow_address: str, amount: Decimal):
        """Allocates HMT token to the escrow.

        Args:
            escrow_address (str): Address of the escrow
            amount (Decimal): Amount to allocate

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to allocate must be greater than 0")

        self._handle_transaction(
            "Allocate HMT",
            self.staking_contract.functions.allocate(escrow_address, amount),
        )

    def close_allocation(self, escrow_address: str):
        """Closes allocated HMT token from the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
        """

        self._handle_transaction(
            "Close allocation",
            self.staking_contract.functions.closeAllocation(escrow_address),
        )

    def unstake(self, amount: Decimal):
        """Unstakes HMT token.

        Args:
            amount (Decimal): Amount to unstake

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")

        self._handle_transaction(
            "Unstake HMT", self.staking_contract.functions.unstake(amount)
        )

    def withdraw(self, amount: Decimal):
        """Withdraws HMT token.

        Args:
            amount (Decimal): Amount to withdraw

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to withdraw must be greater than 0")

        self._handle_transaction(
            "Withdraw HMT", self.staking_contract.functions.withdraw(amount)
        )

    def slash(self, slasher: str, staker: str, escrow_address: str, amount: Decimal):
        """Slashes HMT token.

        Args:
            amount (Decimal): Amount to slash

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to slash must be greater than 0")

        self._handle_transaction(
            "Slash HMT",
            self.staking_contract.functions.slash(
                slasher, staker, escrow_address, amount
            ),
        )

    def distribute_rewards(self, escrow_address: str):
        """Pays out rewards to the slashers for the specified escrow address.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
        """

        self._handle_transaction(
            "Distribute reward",
            self.reward_pool_contract.functions.distributeReward(escrow_address),
        )

    def _handle_transaction(self, tx_name, tx):
        try:
            tx_hash = tx.transact()
            self.w3.eth.waitForTransactionReceipt(tx_hash)
        except Exception as e:
            LOG.exception(f"{tx_name} failed due to {e}.")
            raise StakingClientError("Transaction failed.")
