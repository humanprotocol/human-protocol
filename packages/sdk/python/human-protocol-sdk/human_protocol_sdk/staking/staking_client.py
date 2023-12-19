"""
This client enables to perform actions on staking contracts and
obtain staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create Web3 instance, and configure default account,
as well as some middlewares.

Code Example
------------

* With Signer

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import construct_sign_and_send_raw_middleware
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.staking import StakingClient

    def get_w3_with_priv_key(priv_key: str):
        w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
        gas_payer = w3.eth.account.from_key(priv_key)
        w3.eth.default_account = gas_payer.address
        w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(gas_payer),
            "construct_sign_and_send_raw_middleware",
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
from web3.middleware import geth_poa_middleware
from web3.types import TxParams

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.utils import (
    get_erc20_interface,
    get_factory_interface,
    get_staking_interface,
    get_reward_pool_interface,
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

        :param escrow_address: Escrow address
        :param staker: Staker address
        :param tokens: Amount allocated
        :param created_at: Creation date
        :param closed_at: Closing date
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

        :param w3: Web3 instance

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
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.approve_stake(amount)
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
            tx_options,
        )

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
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether')
                    # convert from ETH to WEI
                staking_client.approve_stake(amount)
                    # if it was already approved before, this is not necessary
                staking_client.stake(amount)
        """

        if amount <= 0:
            raise StakingClientError("Amount to stake must be greater than 0")

        handle_transaction(
            self.w3,
            "Stake HMT",
            self.staking_contract.functions.stake(amount),
            StakingClientError,
            tx_options,
        )

    def allocate(
        self,
        escrow_address: str,
        amount: Decimal,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Allocates HMT token to the escrow.

        :param escrow_address: Address of the escrow
        :param amount: Amount to allocate
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Amount must be greater than 0
            - Escrow address must be valid
            - Amount must be less than or equal to the staked amount (on-chain)

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount)
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
            tx_options,
        )

    def close_allocation(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> None:
        """Closes allocated HMT token from the escrow.

        :param escrow_address: Address of the escrow
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Escrow address must be valid
            - Escrow should be cancelled / completed (on-chain)

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                staking_client.close_allocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f')
        """

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Close allocation",
            self.staking_contract.functions.closeAllocation(escrow_address),
            StakingClientError,
            tx_options,
        )

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
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                staking_client.unstake(amount)
        """

        if amount <= 0:
            raise StakingClientError("Amount to unstake must be greater than 0")

        handle_transaction(
            self.w3,
            "Unstake HMT",
            self.staking_contract.functions.unstake(amount),
            StakingClientError,
            tx_options,
        )

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
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                staking_client.withdraw()
        """

        handle_transaction(
            self.w3,
            "Withdraw HMT",
            self.staking_contract.functions.withdraw(),
            StakingClientError,
            tx_options,
        )

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
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
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

        handle_transaction(
            self.w3,
            "Slash HMT",
            self.staking_contract.functions.slash(
                slasher, staker, escrow_address, amount
            ),
            StakingClientError,
            tx_options,
        )

    def distribute_reward(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> None:
        """Pays out rewards to the slashers for the specified escrow address.

        :param escrow_address: Address of the escrow
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :validate:
            - Escrow address must be valid

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                staking_client = StakingClient(w3)

                staking_client.distribute_reward('0x62dD51230A30401C455c8398d06F85e4EaB6309f')
        """

        if not self._is_valid_escrow(escrow_address):
            raise StakingClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Distribute reward",
            self.reward_pool_contract.functions.distributeReward(escrow_address),
            StakingClientError,
            tx_options,
        )

    def get_allocation(self, escrow_address: str) -> Optional[AllocationData]:
        """Gets the allocation info for the specified escrow.

        :param escrow_address: Address of the escrow

        :return: Allocation info if escrow exists, otherwise None

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.staking import StakingClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                staking_client = StakingClient(w3)

                allocation = staking_client.get_allocation(
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
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

        :param escrow_address: Address of the escrow

        :return: True if the escrow address is valid, False otherwise
        """

        # TODO: Use Escrow/Job Module once implemented
        return self.factory_contract.functions.hasEscrow(escrow_address).call()
