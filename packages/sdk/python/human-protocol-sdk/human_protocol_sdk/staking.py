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


class Staking:
    """A class used to manage staking, and allocation on the HUMAN network.

    Args:
        staking_addr (str): The address of staking contract

    Attributes:


    """

    def __init__(
        self,
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

        self.hmt_server_addr = hmt_server_addr
        self.hmtoken_addr = HMTOKEN_ADDR if hmtoken_addr is None else hmtoken_addr
        self.staking_addr = STAKING_ADDR if staking_addr is None else staking_addr
        self.gas = gas_limit or GAS_LIMIT

        self.staking_contract = get_staking(self.staking_addr, self.hmt_server_addr)

    def stake(self, amount: Decimal, staker: str, priv_key: str) -> bool:
        """Stakes HMT token.

        Args:
            amount (Decimal): Amount to stake
            staker (Optional[str]): Operator to stake

        Returns:
            bool: returns True if staking succeeds.
        """
        # Approve HMT
        hmtoken_contract = get_hmtoken(self.hmtoken_addr, self.hmt_server_addr)

        txn_event = "Approving HMT"
        txn_func = hmtoken_contract.functions.approve
        txn_info = {
            "gas_payer": staker,
            "gas_payer_priv": priv_key,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }
        func_args = [self.staking_addr, amount]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
        except Exception as e:
            LOG.exception(f"{txn_event} failed from: {staker}, {priv_key} due to {e}.")

        txn_event = "Staking HMT"
        txn_func = self.staking_contract.functions.stake
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

    def allocate(
        self, escrow_addr: str, amount: Decimal, staker: str, priv_key: str
    ) -> bool:
        """Allocates HMT token to the escrow.

        Args:
            amount (Decimal): Amount to allocate
            staker (Optional[str]): Operator to allocate

        Returns:
            bool: returns True if allocating succeeds.
        """
        txn_event = "Allocating HMT to job"
        txn_func = self.staking_contract.functions.allocate
        txn_info = {
            "gas_payer": staker,
            "gas_payer_priv": priv_key,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        func_args = [escrow_addr, amount]

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
