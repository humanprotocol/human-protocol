"""Client for staking actions and queries on HUMAN Protocol.

Internally selects network config based on the Web3 chain id.

Example:
    ```python
    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import SignAndSendRawMiddlewareBuilder
    from web3.providers.auto import load_provider_from_uri
    from human_protocol_sdk.staking import StakingClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key("YOUR_PRIVATE_KEY")
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.inject(
        SignAndSendRawMiddlewareBuilder.build("YOUR_PRIVATE_KEY"),
        "SignAndSendRawMiddlewareBuilder",
        layer=0,
    )
    staking_client = StakingClient(w3)
    ```
"""

import logging
import os

from typing import Optional

import web3
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import TxParams

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.decorators import requires_signer
from human_protocol_sdk.utils import (
    get_erc20_interface,
    get_factory_interface,
    get_staking_interface,
    handle_error,
)

LOG = logging.getLogger("human_protocol_sdk.staking")


class StakingClientError(Exception):
    """Raised when an error occurs interacting with staking."""

    pass


class StakingClient:
    """Manage staking on the HUMAN network."""

    def __init__(self, w3: Web3):
        """Create a staking client.

        Args:
            w3: Web3 instance configured for the target network.
        """

        # Initialize web3 instance
        self.w3 = w3
        if not self.w3.middleware_onion.get("ExtraDataToPOA"):
            self.w3.middleware_onion.inject(
                ExtraDataToPOAMiddleware, "ExtraDataToPOA", layer=0
            )

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

    @requires_signer
    def approve_stake(self, amount: int, tx_options: Optional[TxParams] = None) -> None:
        """Approve HMT tokens for staking.

        Args:
            amount: Amount to approve (must be positive).
            tx_options: Optional transaction parameters.
        """

        if amount <= 0:
            raise StakingClientError("Amount to approve must be greater than 0")
        try:
            tx_hash = self.hmtoken_contract.functions.approve(
                self.network["staking_address"], amount
            ).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def stake(self, amount: int, tx_options: Optional[TxParams] = None) -> None:
        """Stake HMT tokens.

        Args:
            amount: Amount to stake (must be greater than 0 and within approved/balance limits).
            tx_options: Optional transaction parameters.

        Raises:
            StakingClientError: If the amount is invalid or the transaction fails.

        Example:
            ```python
            from eth_typing import URI
            from web3 import Web3
            from web3.middleware import SignAndSendRawMiddlewareBuilder
            from web3.providers.auto import load_provider_from_uri
            from human_protocol_sdk.staking import StakingClient

            w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
            gas_payer = w3.eth.account.from_key("YOUR_PRIVATE_KEY")
            w3.eth.default_account = gas_payer.address
            w3.middleware_onion.inject(
                SignAndSendRawMiddlewareBuilder.build("YOUR_PRIVATE_KEY"),
                "SignAndSendRawMiddlewareBuilder",
                layer=0,
            )

            staking_client = StakingClient(w3)
            amount = Web3.to_wei(5, "ether")
            staking_client.approve_stake(amount)
            staking_client.stake(amount)
            ```
        """

        if amount <= 0:
            raise StakingClientError("Amount to stake must be greater than 0")
        try:
            tx_hash = self.staking_contract.functions.stake(amount).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def unstake(self, amount: int, tx_options: Optional[TxParams] = None) -> None:
        """Unstake HMT tokens.

        Args:
            amount: Amount to unstake (must be greater than 0 and <= unlocked stake).
            tx_options: Optional transaction parameters.

        Raises:
            StakingClientError: If the amount is invalid or the transaction fails.

        Example:
            ```python
            amount = Web3.to_wei(5, "ether")
            staking_client.unstake(amount)
            ```
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")
        try:
            tx_hash = self.staking_contract.functions.unstake(amount).transact(
                tx_options
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def withdraw(self, tx_options: Optional[TxParams] = None) -> None:
        """Withdraw unlocked unstaked HMT tokens.

        Args:
            tx_options: Optional transaction parameters.

        Raises:
            StakingClientError: If the transaction fails or no tokens are withdrawable.

        Example:
            ```python
            staking_client.withdraw()
            ```
        """

        try:
            tx_hash = self.staking_contract.functions.withdraw().transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def slash(
        self,
        slasher: str,
        staker: str,
        escrow_address: str,
        amount: int,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Slash a staker for a given escrow.

        Args:
            slasher: Address of the slasher.
            staker: Address of the staker.
            escrow_address: Address of the escrow.
            amount: Amount to slash (must be > 0 and within allocation).
            tx_options: Optional transaction parameters.
        """

        if amount <= 0:
            raise StakingClientError("Amount to slash must be greater than 0")
        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")
        try:
            tx_hash = self.staking_contract.functions.slash(
                slasher, staker, escrow_address, amount
            ).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    def get_staker_info(self, staker_address: str) -> dict:
        """Retrieve comprehensive staking information for a staker.

        Args:
            staker_address: Address of the staker.

        Returns:
            Dictionary containing staker information.

        Raises:
            StakingClientError: If the staker address is invalid.

        Example:
            ```python
            staking_info = staking_client.get_staker_info("0xYourStakerAddress")
            print(staking_info["stakedAmount"])
            ```
        """
        if not Web3.is_address(staker_address):
            raise StakingClientError(f"Invalid staker address: {staker_address}")

        try:
            staker_info = self.staking_contract.functions.stakes(staker_address).call()
            current_block = self.w3.eth.block_number

            tokens_withdrawable = (
                staker_info[1]
                if (staker_info[2] != 0 and current_block >= staker_info[2])
                else 0
            )

            adjusted_locked_amount = (
                0
                if (staker_info[2] != 0 and current_block >= staker_info[2])
                else staker_info[1]
            )

            return {
                "stakedAmount": staker_info[0],
                "lockedAmount": adjusted_locked_amount,
                "lockedUntil": 0 if adjusted_locked_amount == 0 else staker_info[2],
                "withdrawableAmount": tokens_withdrawable,
            }
        except Exception as e:
            raise StakingClientError(f"Failed to get staker info: {str(e)}")

    def _is_valid_escrow(self, escrow_address: str) -> bool:
        """Check if an escrow address exists in the factory.

        Args:
            escrow_address: Escrow address to validate.

        Returns:
            True if the escrow exists in the factory registry; otherwise False.
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()
