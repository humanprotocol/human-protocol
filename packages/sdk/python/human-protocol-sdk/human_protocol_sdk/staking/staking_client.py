"""Client for staking actions on HUMAN Protocol.

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
    """Exception raised when errors occur during staking operations."""

    pass


class StakingClient:
    """Client for interacting with the staking smart contract.

    This client provides methods to stake, unstake, withdraw, and slash HMT tokens,
    as well as query staker information on the Human Protocol network.

    Attributes:
        w3 (Web3): Web3 instance configured for the target network.
        network (dict): Network configuration for the current chain.
        hmtoken_contract (Contract): Contract instance for the HMT token.
        factory_contract (Contract): Contract instance for the escrow factory.
        staking_contract (Contract): Contract instance for the staking contract.
    """

    def __init__(self, w3: Web3):
        """Initialize a StakingClient instance.

        Args:
            w3 (Web3): Web3 instance configured for the target network.
                Must have a valid provider and chain ID.

        Raises:
            StakingClientError: If chain ID is invalid, network configuration is missing,
                or network configuration is empty.

        Example:
            ```python
            from eth_typing import URI
            from web3 import Web3
            from web3.providers.auto import load_provider_from_uri
            from human_protocol_sdk.staking import StakingClient

            w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
            staking_client = StakingClient(w3)
            ```
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

        Grants the staking contract permission to transfer HMT tokens from the caller's
        account. This must be called before staking.

        Args:
            amount (int): Amount of HMT tokens to approve in token's smallest unit
                (must be greater than 0).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            StakingClientError: If the amount is not positive or the transaction fails.

        Example:
            ```python
            from web3 import Web3

            amount = Web3.to_wei(100, "ether")
            staking_client.approve_stake(amount)
            ```
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

        Deposits HMT tokens into the staking contract. The tokens must be approved first
        using ``approve_stake()``.

        Args:
            amount (int): Amount of HMT tokens to stake in token's smallest unit
                (must be greater than 0 and within approved/balance limits).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

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

        Initiates the unstaking process for the specified amount. The tokens will be
        locked for a period before they can be withdrawn.

        Args:
            amount (int): Amount of HMT tokens to unstake in token's smallest unit
                (must be greater than 0 and less than or equal to unlocked staked amount).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

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

        Withdraws all available unstaked tokens that have completed the unlocking period
        and transfers them back to the caller's account.

        Args:
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            StakingClientError: If the transaction fails or no tokens are available to withdraw.

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
        """Slash a staker's stake for a given escrow.

        Penalizes a staker by reducing their staked amount and distributing rewards
        to the slasher for detecting misbehavior or violations.

        Args:
            slasher (str): Address of the entity performing the slash (receives rewards).
            staker (str): Address of the staker to be slashed.
            escrow_address (str): Address of the escrow associated with the violation.
            amount (int): Amount to slash in token's smallest unit
                (must be greater than 0 and within staker's allocation to the escrow).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            StakingClientError: If the amount is invalid, escrow address is invalid,
                or the transaction fails.

        Example:
            ```python
            staking_client.slash(
                "0xSlasherAddress",
                "0xStakerAddress",
                "0xEscrowAddress",
                Web3.to_wei(10, "ether"),
            )
            ```
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

        Fetches on-chain staking data including staked amount, locked amount,
        lock expiration, and withdrawable amount.

        Args:
            staker_address (str): Ethereum address of the staker.

        Returns:
            Staker info with keys:

                - `stakedAmount` (int): Total staked amount.
                - `lockedAmount` (int): Currently locked amount.
                - `lockedUntil` (int): Block number until tokens are locked (0 if unlocked).
                - `withdrawableAmount` (int): Amount available for withdrawal.

        Raises:
            StakingClientError: If the staker address is invalid or the query fails.

        Example:
            ```python
            staking_info = staking_client.get_staker_info("0xYourStakerAddress")
            print(f"Staked: {staking_info['stakedAmount']}")
            print(f"Locked: {staking_info['lockedAmount']}")
            print(f"Withdrawable: {staking_info['withdrawableAmount']}")
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
        """Check if an escrow address exists in the factory registry.

        Internal method to validate that an escrow address is registered with the
        escrow factory contract.

        Args:
            escrow_address (str): Escrow address to validate.

        Returns:
            ``True`` if the escrow exists in the factory registry, ``False`` otherwise.
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()
