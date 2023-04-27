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

    def __init__(self, provider: HTTPProvider, priv_key: str):
        """Initializes a Staking instance

        Args:

        """

        # Initialize web3 instance
        self.w3 = Web3(provider)
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(priv_key)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer)
        )
        self.w3.eth.default_account = self.gas_payer.address

        # Load network configuration based on chain id
        self.network = NETWORKS[ChainId(self.w3.eth.chain_id)]

        if not self.network:
            raise StakingClientError("Invalid chain id")

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

        Validations:
            - Amount must be greater than 0
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

        Validations:
            - Amount must be greater than 0
            - Amount must be less than or equal to the approved amount (on-chain)
            - Amount must be less than or equal to the balance of the staker (on-chain)
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

        Validations:
            - Amount must be greater than 0
            - Escrow address must be valid
            - Amount must be less than or equal to the staked amount (on-chain)
        """

        if amount <= 0:
            raise StakingClientError("Amount to allocate must be greater than 0")

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError("Invalid escrow")

        self._handle_transaction(
            "Allocate HMT",
            self.staking_contract.functions.allocate(escrow_address, amount),
        )

    def close_allocation(self, escrow_address: str):
        """Closes allocated HMT token from the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Validations:
            - Escrow address must be valid
            - Escrow should be cancelled / completed (on-chain)
        """

        self._handle_transaction(
            "Close allocation",
            self.staking_contract.functions.closeAllocation(escrow_address),
        )

    def unstake(self, amount: Decimal):
        """Unstakes HMT token.

        Args:
            amount (Decimal): Amount to unstake

        Validations:
            - Amount must be greater than 0
            - Amount must be less than or equal to the staked amount which is not locked / allocated (on-chain)
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")

        self._handle_transaction(
            "Unstake HMT", self.staking_contract.functions.unstake(amount)
        )

    def withdraw(self):
        """Withdraws HMT token.

        Validations:
            - There must be unstaked tokens which is unlocked (on-chain)
        """

        self._handle_transaction(
            "Withdraw HMT", self.staking_contract.functions.withdraw()
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

    def get_staker_info(self, staker_address: Optional[str] = None) -> dict:
        """Gets the staker info.

        Args:
            staker_address (Optional[str]): Address of the staker, defaults to the default account

        Returns:
            dict: Staker info
        """

        if not staker_address:
            staker_address = self.w3.eth.default_account

        [
            tokens_staked,
            tokens_allocated,
            tokens_locked,
            tokens_locked_until,
        ] = self.staking_contract.functions.getStaker(staker_address).call()

        return {
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
            Optional[dict]: Allocation info
        """

        [
            escrow_address,
            staker,
            tokens,
            created_at,
            closed_at,
        ] = self.staking_contract.functions.getAllocation(escrow_address).call()

        return {
            "escrow_address": escrow_address,
            "staker": staker,
            "tokens": tokens,
            "created_at": created_at,
            "closed_at": closed_at,
        }

    def _is_valid_escrow(self, escrow_address: str) -> bool:
        """Checks if the escrow address is valid.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            bool: True if the escrow address is valid, False otherwise
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()

    def _handle_transaction(self, tx_name, tx):
        """Executes the transaction and waits for the receipt.

        Args:
            tx_name (str): Name of the transaction
            tx (obj): Transaction object

        """
        try:
            tx_hash = tx.transact()
            self.w3.eth.waitForTransactionReceipt(tx_hash)
        except Exception as e:
            LOG.exception(f"{tx_name} failed due to {e}.")
            raise StakingClientError("Transaction failed.")
