"""
This client enables performing actions on staking contracts and
obtaining staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create a Web3 instance and configure the default account,
as well as some middlewares.

Code Example
------------

* With Signer

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import SignAndSendRawMiddlewareBuilder
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.staking import StakingClient

    def get_w3_with_priv_key(priv_key: str):
        w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
        gas_payer = w3.eth.account.from_key(priv_key)
        w3.eth.default_account = gas_payer.address
        w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(priv_key),
            'SignAndSendRawMiddlewareBuilder',
            layer=0,
        )
        return (w3, gas_payer)

    (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
    staking_client = StakingClient(w3)

* Without Signer (For read operations only)

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.staking import StakingClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    staking_client = StakingClient(w3)

Module
------
"""

import logging
import os

from decimal import Decimal
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
    """
    Raises when some error happens when interacting with staking.
    """

    pass


class StakingClient:
    """
    A class used to manage staking on the HUMAN network.
    """

    def __init__(self, w3: Web3):
        """Initializes a Staking instance

        :param w3: Web3 instance

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
    def approve_stake(
        self, amount: Decimal, tx_options: Optional[TxParams] = None
    ) -> None:
        """Approves HMT token for Staking.

        :param amount: Amount to approve
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            Amount must be greater than 0

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.approve_stake(amount)
        """

        if amount <= 0:
            raise StakingClientError("Amount to approve must be greater than 0")
        try:
            tx_hash = self.hmtoken_contract.functions.approve(
                self.network["staking_address"], amount
            ).transact(tx_options or {})
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def stake(self, amount: Decimal, tx_options: Optional[TxParams] = None) -> None:
        """Stakes HMT token.

        :param amount: Amount to stake
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Amount must be greater than 0
            - Amount must be less than or equal to the approved amount (on-chain)
            - Amount must be less than or equal to the balance of the staker (on-chain)

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.approve_stake(amount) # if it was already approved before, this is not necessary
                staking_client.stake(amount)
        """

        if amount <= 0:
            raise StakingClientError("Amount to stake must be greater than 0")
        try:
            tx_hash = self.staking_contract.functions.stake(amount).transact(
                tx_options or {}
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def unstake(self, amount: Decimal, tx_options: Optional[TxParams] = None) -> None:
        """Unstakes HMT token.

        :param amount: Amount to unstake
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Amount must be greater than 0
            - Amount must be less than or equal to the staked amount which is not locked / allocated (on-chain)

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.unstake(amount)
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")
        try:
            tx_hash = self.staking_contract.functions.unstake(amount).transact(
                tx_options or {}
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def withdraw(self, tx_options: Optional[TxParams] = None) -> None:
        """Withdraws HMT token.

        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - There must be unstaked tokens which is unlocked (on-chain)

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                staking_client.withdraw()
        """

        try:
            tx_hash = self.staking_contract.functions.withdraw().transact(
                tx_options or {}
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    @requires_signer
    def slash(
        self,
        slasher: str,
        staker: str,
        escrow_address: str,
        amount: Decimal,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Slashes HMT token.

        :param slasher: Address of the slasher
        :param staker: Address of the staker
        :param escrow_address: Address of the escrow
        :param amount: Amount to slash
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Amount must be greater than 0
            - Amount must be less than or equal to the amount allocated to the escrow (on-chain)
            - Escrow address must be valid

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.slash(
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
                    amount
                )
        """

        if amount <= 0:
            raise StakingClientError("Amount to slash must be greater than 0")
        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")
        try:
            tx_hash = self.staking_contract.functions.slash(
                slasher, staker, escrow_address, amount
            ).transact(tx_options or {})
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, StakingClientError)

    def get_staker_info(self, staker_address: str) -> dict:
        """Retrieves comprehensive staking information for a staker.

        :param staker_address: The address of the staker
        :return: A dictionary containing staker information

        :validate:
            - Staker address must be valid

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                staking_client = StakingClient(w3)

                staking_info = staking_client.get_staker_info('0xYourStakerAddress')
                print(staking_info['stakedAmount'])
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
        """Checks if the escrow address is valid.

        :param escrow_address: Address of the escrow

        :return: True if the escrow address is valid, False otherwise
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()
