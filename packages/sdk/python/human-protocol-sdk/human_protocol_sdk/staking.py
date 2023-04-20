#!/usr/bin/env python3

import logging
import os

from decimal import Decimal
from typing import Optional

from human_protocol_sdk.eth_bridge import (
    get_hmtoken,
    get_staking,
    handle_transaction_with_retry,
    Retry,
    HMTOKEN_ADDR,
    STAKING_ADDR,
)

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.job")


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

    def __init__(
        self,
        staker: str,
        priv_key: str,
        hmtoken_addr: str = None,
        staking_addr: str = None,
        retry: Retry = None,
        hmt_server_addr: str = None,
        gas_limit: int = GAS_LIMIT,
    ):
        """Initializes a Staking instance with optional staking contract address.

        Args:
            staking_addr (Optional[str]): an ethereum address of the staking.

        """

        # holds global retry parameters for transactions
        if retry is None:
            self.retry = Retry()
        else:
            self.retry = retry

        self.gas_payer = staker
        self.gas_payer_priv = priv_key
        self.hmt_server_addr = hmt_server_addr
        self.hmtoken_addr = HMTOKEN_ADDR if hmtoken_addr is None else hmtoken_addr
        self.staking_addr = STAKING_ADDR if staking_addr is None else staking_addr
        self.gas = gas_limit or GAS_LIMIT

        self.hmtoken_contract = get_hmtoken(self.hmtoken_addr, self.hmt_server_addr)
        self.staking_contract = get_staking(self.staking_addr, self.hmt_server_addr)

    def approve_stake(self, amount: Decimal):
        """Approves HMT token for Staking.

        Args:
            amount (Decimal): Amount to approve

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to approve must be greater than 0")

        self._handle_transaction(
            "Approve HMT",
            self.hmtoken_contract.functions.approve,
            [self.staking_addr, amount],
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
            "Stake HMT", self.staking_contract.functions.stake, [amount]
        )

    def allocate(self, escrow_addr: str, amount: Decimal):
        """Allocates HMT token to the escrow.

        Args:
            escrow_addr (str): Address of the escrow
            amount (Decimal): Amount to allocate

        Returns:
        """

        if amount <= 0:
            raise StakingClientError("Amount to allocate must be greater than 0")

        self._handle_transaction(
            "Allocate HMT to escrow",
            self.staking_contract.functions.allocate,
            [escrow_addr, amount],
        )

    def unstake(self, amount: Decimal, staker: str, priv_key: str) -> bool:
        """Unstakes HMT token.

        Args:
            amount (Decimal): Amount to unstake
            staker (Optional[str]): Operator to unstake

        Returns:
            bool: returns True if unstaking succeeds.
        """
        txn_event = "Unstaking HMT"
        txn_func = self.staking_contract.functions.unstake
        txn_info = {
            "gas_payer": staker,
            "gas_payer_priv": priv_key,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        func_args = [amount]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            return True
        except Exception as e:
            LOG.exception(f"{txn_event} failed from: {staker}, {priv_key} due to {e}.")

    def withdraw(self, amount: Decimal, staker: str, priv_key: str) -> bool:
        """Withdraws HMT token.

        Args:
            amount (Decimal): Amount to withdraw
            staker (Optional[str]): Operator to withdraw

        Returns:
            bool: returns True if withdrawing succeeds.
        """
        txn_event = "Withdrawing HMT from stake"
        txn_func = self.staking_contract.functions.withdraw
        txn_info = {
            "gas_payer": staker,
            "gas_payer_priv": priv_key,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        func_args = [amount]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            return True
        except Exception as e:
            LOG.exception(f"{txn_event} failed from: {staker}, {priv_key} due to {e}.")

    def closeAllocation(self, escrow_addr: str, staker: str, priv_key: str) -> bool:
        """Close allocation of HMT token from the escrow.

        Args:
            amount (Decimal): Amount to close allocation
            staker (Optional[str]): Operator to close allocation

        Returns:
            bool: returns True if closing allocation succeeds.
        """
        txn_event = "Closing HMT allocation from job"
        txn_func = self.staking_contract.functions.closeAllocation
        txn_info = {
            "gas_payer": staker,
            "gas_payer_priv": priv_key,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        func_args = [escrow_addr]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            return True
        except Exception as e:
            LOG.exception(f"{txn_event} failed from: {staker}, {priv_key} due to {e}.")

    def _handle_transaction(self, txn_event, txn_func, func_args):
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
        except Exception as e:
            LOG.exception(f"{txn_event} failed due to {e}.")
            raise StakingClientError(e)
