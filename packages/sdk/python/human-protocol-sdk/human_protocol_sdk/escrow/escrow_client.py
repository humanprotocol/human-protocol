"""
This client enables to perform actions on Escrow contracts and
obtain information from both the contracts and subgraph.

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

    from human_protocol_sdk.escrow import EscrowClient

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
    escrow_client = EscrowClient(w3)

* Without Signer (For read operations only)

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.escrow import EscrowClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    escrow_client = EscrowClient(w3)

Module
------
"""

import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.utils import (
    get_escrow_interface,
    get_factory_interface,
    get_erc20_interface,
    handle_transaction,
)
from web3 import Web3, contract
from web3 import eth
from web3.middleware import geth_poa_middleware
from web3.types import TxParams
from eth_utils import abi

from human_protocol_sdk.utils import validate_url

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowCancel:
    def __init__(self, tx_hash: str, amount_refunded: any):
        """
        Represents the result of an escrow cancellation transaction.
        Args:
            tx_hash (str): The hash of the transaction that cancelled the escrow.
            amount_refunded (Any): The amount refunded during the escrow cancellation.
        """
        self.txHash = tx_hash
        self.amountRefunded = amount_refunded


class EscrowClientError(Exception):
    """
    Raises when some error happens when interacting with escrow.
    """

    pass


class EscrowConfig:
    """
    A class used to manage escrow parameters.
    """

    def __init__(
        self,
        recording_oracle_address: str,
        reputation_oracle_address: str,
        exchange_oracle_address: str,
        recording_oracle_fee: Decimal,
        reputation_oracle_fee: Decimal,
        exchange_oracle_fee: Decimal,
        manifest_url: str,
        hash: str,
    ):
        """
        Initializes a Escrow instance.

        :param recording_oracle_address: Address of the Recording Oracle
        :param reputation_oracle_address: Address of the Reputation Oracle
        :param recording_oracle_fee: Fee percentage of the Recording Oracle
        :param reputation_oracle_fee: Fee percentage of the Reputation Oracle
        :param manifest_url: Manifest file url
        :param hash: Manifest file hash
        """
        if not Web3.is_address(recording_oracle_address):
            raise EscrowClientError(
                f"Invalid recording oracle address: {recording_oracle_address}"
            )
        if not Web3.is_address(reputation_oracle_address):
            raise EscrowClientError(
                f"Invalid reputation oracle address: {reputation_oracle_address}"
            )
        if not Web3.is_address(exchange_oracle_address):
            raise EscrowClientError(
                f"Invalid exchange oracle address: {exchange_oracle_address}"
            )

        if (
            not (0 <= recording_oracle_fee <= 100)
            or not (0 <= reputation_oracle_fee <= 100)
            or not (0 <= exchange_oracle_fee <= 100)
        ):
            raise EscrowClientError("Fee must be between 0 and 100")
        if recording_oracle_fee + reputation_oracle_fee + exchange_oracle_fee > 100:
            raise EscrowClientError("Total fee must be less than 100")
        if not validate_url(manifest_url):
            raise EscrowClientError(f"Invalid manifest URL: {manifest_url}")
        if not hash:
            raise EscrowClientError("Invalid empty manifest hash")

        self.recording_oracle_address = recording_oracle_address
        self.reputation_oracle_address = reputation_oracle_address
        self.exchange_oracle_address = exchange_oracle_address
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle_fee = reputation_oracle_fee
        self.exchange_oracle_fee = exchange_oracle_fee
        self.manifest_url = manifest_url
        self.hash = hash


class EscrowClient:
    """
    A class used to manage escrow on the HUMAN network.
    """

    def __init__(self, web3: Web3):
        """
        Initializes a Escrow instance.

        :param web3: The Web3 object
        """

        # Initialize web3 instance
        self.w3 = web3
        if not self.w3.middleware_onion.get("geth_poa"):
            self.w3.middleware_onion.inject(geth_poa_middleware, "geth_poa", layer=0)

        chain_id = None
        # Load network configuration based on chain_id
        try:
            chain_id = self.w3.eth.chain_id
            self.network = NETWORKS[ChainId(chain_id)]
        except:
            if chain_id is not None:
                raise EscrowClientError(f"Invalid ChainId: {chain_id}")
            else:
                raise EscrowClientError(f"Invalid Web3 Instance")

        # Initialize contract instances
        factory_interface = get_factory_interface()
        self.factory_contract = self.w3.eth.contract(
            address=self.network["factory_address"], abi=factory_interface["abi"]
        )

    def create_escrow(
        self,
        token_address: str,
        trusted_handlers: List[str],
        job_requester_id: str,
        tx_options: Optional[TxParams] = None,
    ) -> str:
        """
        Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

        :param tokenAddress: The address of the token to use for payouts
        :param trusted_handlers: Array of addresses that can perform actions on the contract
        :param job_requester_id: The id of the job requester
        :param tx_options: (Optional) Additional transaction parameters

        :return: The address of the escrow created

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                token_address = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
                trusted_handlers = [
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
                ]
                job_requester_id = 'job-requester'
                escrow_address = escrow_client.create_escrow(
                    token_address,
                    trusted_handlers,
                    job_requester_id
                )
        """
        if not Web3.is_address(token_address):
            raise EscrowClientError(f"Invalid token address: {token_address}")

        for handler in trusted_handlers:
            if not Web3.is_address(handler):
                raise EscrowClientError(f"Invalid handler address: {handler}")

        transaction_receipt = handle_transaction(
            self.w3,
            "Create Escrow",
            self.factory_contract.functions.createEscrow(
                token_address, trusted_handlers, job_requester_id
            ),
            EscrowClientError,
            tx_options,
        )
        return next(
            (
                self.factory_contract.events.LaunchedV2().process_log(log)
                for log in transaction_receipt["logs"]
                if log["address"] == self.network["factory_address"]
            ),
            None,
        ).args.escrow

    def setup(
        self,
        escrow_address: str,
        escrow_config: EscrowConfig,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """
        Sets up the parameters of the escrow.

        :param escrow_address: Address of the escrow to setup
        :param escrow_config: Object containing all the necessary information to setup an escrow
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                escrow_address = "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                escrow_config = EscrowConfig(
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    10,
                    10,
                    10,
                    "htttp://localhost/manifest.json",
                    "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079",
                )
                escrow_client.setup(escrow_address, escrow_config)
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Setup",
            self._get_escrow_contract(escrow_address).functions.setup(
                escrow_config.reputation_oracle_address,
                escrow_config.recording_oracle_address,
                escrow_config.exchange_oracle_address,
                escrow_config.reputation_oracle_fee,
                escrow_config.recording_oracle_fee,
                escrow_config.exchange_oracle_fee,
                escrow_config.manifest_url,
                escrow_config.hash,
            ),
            EscrowClientError,
            tx_options,
        )

    def create_and_setup_escrow(
        self,
        token_address: str,
        trusted_handlers: List[str],
        job_requester_id: str,
        escrow_config: EscrowConfig,
    ) -> str:
        """
        Creates and sets up an escrow.

        :param token_address: Token to use for pay outs
        :param trusted_handlers: Array of addresses that can perform actions on the contract
        :param job_requester_id: The id of the job requester
        :param escrow_config: Object containing all the necessary information to setup an escrow

        :return: The address of the escrow created

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                token_address = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
                trusted_handlers = [
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
                ]
                job_requester_id = 'job-requester'
                escrow_config = EscrowConfig(
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    10,
                    10,
                    10,
                    "htttp://localhost/manifest.json",
                    "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079",
                )
                escrow_address = escrow_client.create_and_setup_escrow(
                    token_address,
                    trusted_handlers,
                    job_requester_id,
                    escrow_config
                )
        """

        escrow_address = self.create_escrow(
            token_address, trusted_handlers, job_requester_id
        )
        self.setup(escrow_address, escrow_config)

        return escrow_address

    def fund(
        self,
        escrow_address: str,
        amount: Decimal,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """
        Adds funds to the escrow.

        :param escrow_address: Address of the escrow to setup
        :param amount: Amount to be added as funds
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
                escrow_client.fund("0x62dD51230A30401C455c8398d06F85e4EaB6309f", amount)
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        if 0 >= amount:
            raise EscrowClientError("Amount must be positive")

        token_address = self.get_token_address(escrow_address)

        erc20_interface = get_erc20_interface()
        token_contract = self.w3.eth.contract(token_address, abi=erc20_interface["abi"])

        handle_transaction(
            self.w3,
            "Fund",
            token_contract.functions.transfer(escrow_address, amount),
            EscrowClientError,
            tx_options,
        )

    def store_results(
        self,
        escrow_address: str,
        url: str,
        hash: str,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Stores the results url.

        :param escrow_address: Address of the escrow
        :param url: Results file url
        :param hash: Results file hash
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                escrow_client.store_results(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                    "http://localhost/results.json",
                    "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        if not hash:
            raise EscrowClientError("Invalid empty hash")
        if not validate_url(url):
            raise EscrowClientError(f"Invalid URL: {url}")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        handle_transaction(
            self.w3,
            "Store Results",
            self._get_escrow_contract(escrow_address).functions.storeResults(url, hash),
            EscrowClientError,
            tx_options,
        )

    def complete(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> None:
        """Sets the status of an escrow to completed.

        :param escrow_address: Address of the escrow to complete
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                escrow_client.complete("0x62dD51230A30401C455c8398d06F85e4EaB6309f")
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Complete",
            self._get_escrow_contract(escrow_address).functions.complete(),
            EscrowClientError,
            tx_options,
        )

    def bulk_payout(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[Decimal],
        final_results_url: str,
        final_results_hash: str,
        txId: Decimal,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Pays out the amounts specified to the workers and sets the URL of the final results file.

        :param escrow_address: Address of the escrow
        :param recipients: Array of recipient addresses
        :param amounts: Array of amounts the recipients will receive
        :param final_results_url: Final results file url
        :param final_results_hash: Final results file hash
        :param txId: Serial number of the bulks
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                recipients = [
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92267'
                ]
                amounts = [
                    Web3.to_wei(5, 'ether'),
                    Web3.to_wei(10, 'ether')
                ]
                results_url = 'http://localhost/results.json'
                results_hash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079'

                escrow_client.bulk_payout(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                    recipients,
                    amounts,
                    results_url,
                    results_hash,
                    1
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        for recipient in recipients:
            if not Web3.is_address(recipient):
                raise EscrowClientError(f"Invalid recipient address: {recipient}")
        if len(recipients) == 0:
            raise EscrowClientError("Arrays must have any value")
        if len(recipients) != len(amounts):
            raise EscrowClientError("Arrays must have same length")
        if 0 in amounts:
            raise EscrowClientError("Amounts cannot be empty")
        if any(amount < 0 for amount in amounts):
            raise EscrowClientError("Amounts cannot be negative")
        balance = self.get_balance(escrow_address)
        total_amount = sum(amounts)
        if total_amount > balance:
            raise EscrowClientError(
                f"Escrow does not have enough balance. Current balance: {balance}. Amounts: {total_amount}"
            )
        if not validate_url(final_results_url):
            raise EscrowClientError(f"Invalid final results URL: {final_results_url}")
        if not final_results_hash:
            raise EscrowClientError("Invalid empty final results hash")

        handle_transaction(
            self.w3,
            "Bulk Payout",
            self._get_escrow_contract(escrow_address).functions.bulkPayOut(
                recipients, amounts, final_results_url, final_results_hash, txId
            ),
            EscrowClientError,
            tx_options,
        )

    def cancel(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> EscrowCancel:
        """Cancels the specified escrow and sends the balance to the canceler.

        :param escrow_address: Address of the escrow to cancel
        :param tx_options: (Optional) Additional transaction parameters

        :return: EscrowCancel:
            An instance of the EscrowCancel class containing details of the cancellation transaction,
            including the transaction hash and the amount refunded.

        :raise EscrowClientError: If an error occurs while checking the parameters
        :raise EscrowClientError: If the transfer event associated with the cancellation
                                is not found in the transaction logs


        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                escrow_cancel_data = escrow_client.cancel(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        transaction_receipt = handle_transaction(
            self.w3,
            "Cancel",
            self._get_escrow_contract(escrow_address).functions.cancel(),
            EscrowClientError,
            tx_options,
        )

        amount_transferred = None
        token_address = self.get_token_address(escrow_address)

        erc20_interface = get_erc20_interface()
        token_contract = self.w3.eth.contract(token_address, abi=erc20_interface["abi"])

        for log in transaction_receipt["logs"]:
            if log["address"] == token_address:
                processed_log = token_contract.events.Transfer().process_log(log)

                if (
                    processed_log["event"] == "Transfer"
                    and processed_log["args"]["from"] == escrow_address
                ):
                    amount_transferred = processed_log["args"]["value"]
                    break

        if amount_transferred is None:
            raise EscrowClientError("Transfer Event Not Found in Transaction Logs")

        escrow_cancel_data = EscrowCancel(
            tx_hash=transaction_receipt["transactionHash"].hex(),
            amount_refunded=amount_transferred,
        )

        return escrow_cancel_data

    def abort(self, escrow_address: str, tx_options: Optional[TxParams] = None) -> None:
        """Cancels the specified escrow,
        sends the balance to the canceler and selfdestructs the escrow contract.

        :param escrow_address: Address of the escrow to abort
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                escrow_client.abort("0x62dD51230A30401C455c8398d06F85e4EaB6309f")
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Abort",
            self._get_escrow_contract(escrow_address).functions.abort(),
            EscrowClientError,
            tx_options,
        )

    def add_trusted_handlers(
        self,
        escrow_address: str,
        handlers: List[str],
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Adds an array of addresses to the trusted handlers list.

        :param escrow_address: Address of the escrow
        :param handlers: Array of trusted handler addresses
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

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
                escrow_client = EscrowClient(w3)

                trusted_handlers = [
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
                ]
                escrow_client.add_trusted_handlers(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                    trusted_handlers
                )
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        for handler in handlers:
            if not Web3.is_address(handler):
                raise EscrowClientError(f"Invalid handler address: {handler}")

        handle_transaction(
            self.w3,
            "Add Trusted Handlers",
            self._get_escrow_contract(escrow_address).functions.addTrustedHandlers(
                handlers
            ),
            EscrowClientError,
            tx_options,
        )

    def get_balance(self, escrow_address: str) -> Decimal:
        """Gets the balance for a specified escrow address.

        :param escrow_address: Address of the escrow

        :return: Value of the balance

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                balance = escrow_client.get_balance(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.getBalance().call()

    def get_manifest_hash(self, escrow_address: str) -> str:
        """Gets the manifest file hash.

        :param escrow_address: Address of the escrow

        :return: Manifest file hash

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                manifest_hash = escrow_client.get_manifest_hash(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestHash().call()

    def get_manifest_url(self, escrow_address: str) -> str:
        """Gets the manifest file URL.

        :param escrow_address: Address of the escrow

        :return str: Manifest file url

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                url = escrow_client.get_manifest_url(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestUrl().call()

    def get_results_url(self, escrow_address: str) -> str:
        """Gets the results file URL.

        :param escrow_address: Address of the escrow

        :return: Results file url

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                url = escrow_client.get_results_url(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.finalResultsUrl().call()
        )

    def get_intermediate_results_url(self, escrow_address: str) -> str:
        """Gets the intermediate results file URL.

        :param escrow_address: Address of the escrow

        :return: Intermediate results file url

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                url = escrow_client.get_intermediate_results_url(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.intermediateResultsUrl()
            .call()
        )

    def get_token_address(self, escrow_address: str) -> str:
        """Gets the address of the token used to fund the escrow.

        :param escrow_address: Address of the escrow

        :return: Address of the token

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                token_address = escrow_client.get_token_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.token().call()

    def get_status(self, escrow_address: str) -> Status:
        """Gets the current status of the escrow.

        :param escrow_address: Address of the escrow

        :return: Current escrow status

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                status = escrow_client.get_status(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return Status(
            self._get_escrow_contract(escrow_address).functions.status().call()
        )

    def get_recording_oracle_address(self, escrow_address: str) -> str:
        """Gets the recording oracle address of the escrow.

        :param escrow_address: Address of the escrow

        :return: Recording oracle address

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                recording_oracle = escrow_client.get_recording_oracle_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.recordingOracle().call()
        )

    def get_reputation_oracle_address(self, escrow_address: str) -> str:
        """Gets the reputation oracle address of the escrow.

        :param escrow_address: Address of the escrow

        :return: Reputation oracle address

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                reputation_oracle = escrow_client.get_reputation_oracle_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.reputationOracle()
            .call()
        )

    def get_exchange_oracle_address(self, escrow_address: str) -> str:
        """Gets the exchange oracle address of the escrow.

        :param escrow_address: Address of the escrow

        :return: Exchange oracle address

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                exchange_oracle = escrow_client.get_exchange_oracle_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.exchangeOracle().call()
        )

    def get_job_launcher_address(self, escrow_address: str) -> str:
        """Gets the job launcher address of the escrow.

        :param escrow_address: Address of the escrow

        :return: Job launcher address

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                job_launcher = escrow_client.get_job_launcher_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.launcher().call()

    def get_factory_address(self, escrow_address: str) -> str:
        """Gets the escrow factory address of the escrow.

        :param escrow_address: Address of the escrow

        :return: Escrow factory address

        :raise EscrowClientError: If an error occurs while checking the parameters

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.escrow import EscrowClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                escrow_client = EscrowClient(w3)

                escrow_factory = escrow_client.get_factory_address(
                    "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
                )
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.escrowFactory().call()
        )

    def _get_escrow_contract(self, address: str) -> contract.Contract:
        """Returns the escrow contract instance.

        :param escrow_address: Address of the deployed escrow

        :return: The instance of the escrow contract

        """

        if not self.factory_contract.functions.hasEscrow(address):
            raise EscrowClientError("Escrow address is not provided by the factory")
        # Initialize contract instance
        escrow_interface = get_escrow_interface()
        return self.w3.eth.contract(address=address, abi=escrow_interface["abi"])
