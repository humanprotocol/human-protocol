#!/usr/bin/env python3

import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.utils import get_factory_interface, get_escrow_interface
from web3 import Web3
from web3.middleware import geth_poa_middleware
from validators import url

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowClientError(Exception):
    """
    Raises when some error happens when interacting with escrow.
    """

    pass


class EscrowConfig:
    """
    Raises when some error happens when interacting with escrow.
    """

    def __init__(
        self,
        exchange_oracle_address: str,
        recording_oracle_address: str,
        reputation_oracle_address: str,
        exchange_oracle_fee: Decimal,
        recording_oracle_fee: Decimal,
        reputation_oracle_fee: Decimal,
        manifestUrl: str,
        hash: str,
    ):
        if (
            not Web3.isAddress(exchange_oracle_address)
            or not Web3.isAddress(recording_oracle_address)
            or not Web3.isAddress(reputation_oracle_address)
        ):
            raise EscrowClientError("Invalid address")
        if (
            not (0 <= exchange_oracle_fee <= 100)
            or not (0 <= recording_oracle_fee <= 100)
            or not (0 <= reputation_oracle_fee <= 100)
        ):
            raise ValueError("Fee must be between 0 and 100")
        if url(manifestUrl):
            raise EscrowClientError("Invalid URL")
        if not hash:
            raise EscrowClientError("Invalid hash")

        self.exchange_oracle_address = exchange_oracle_address
        self.recording_oracle_address = recording_oracle_address
        self.reputation_oracle_address = reputation_oracle_address
        self.exchange_oracle_fee = exchange_oracle_fee
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle_fee = reputation_oracle_fee
        self.manifestUrl = manifestUrl
        self.hash = hash


class EscrowClient:
    """
    A class used to manage escrow on the HUMAN network.
    """

    def __init__(self, web3: Web3):
        """
        Initializes a Escrow instance.

        Args:
            web3 (Web3): The Web3 object
        """

        # Initialize web3 instance
        self.w3 = web3
        if not self.w3.middleware_onion.get("geth_poa"):
            self.w3.middleware_onion.inject(geth_poa_middleware, "geth_poa", layer=0)

        # Load network configuration based on chainId
        try:
            self.network = NETWORKS[ChainId(self.w3.eth.chain_id)]
        except:
            raise EscrowClientError("Invalid ChainId")

        # Initialize contract instances
        factory_interface = get_factory_interface()
        self.factory_contract = self.w3.eth.contract(
            address=self.network["factory_address"], abi=factory_interface["abi"]
        )

    def createEscrow(self, tokenAddress: str, trusted_handlers: List[str]):
        """
        Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

        Args:
            tokenAddress (str): The address of the token to use for payouts
            trusted_handlers (List[str]): Array of addresses that can perform actions on the contract

        Returns:
            str: The address of the escrow created

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """
        if not Web3.isAddress(tokenAddress) or not all(
            Web3.isAddress(handler) for handler in trusted_handlers
        ):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Create Escrow",
            self.factory_contract.functions.createEscrow(
                tokenAddress, trusted_handlers
            ),
        )

        return self.factory_contract.functions.lastEscrow().call()

    def setup(self, escrow_address: str, escrow_config: EscrowConfig):
        """
        Sets up the parameters of the escrow.

        Args:
            keys (List[str]): A list of keys to set
            values (List[str]): A list of values to set

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Setup",
            self._get_escrow_contract(escrow_address).functions.setup(
                escrow_config.exchange_oracle_address,
                escrow_config.recording_oracle_address,
                escrow_config.reputation_oracle_address,
                escrow_config.exchange_oracle_fee,
                escrow_config.recording_oracle_fee,
                escrow_config.reputation_oracle_fee,
                escrow_config.manifestUrl,
                escrow_config.hash,
            ),
        )

    def store_results(self, escrow_address: str, url: str, hash: str):
        """Stores the results url.

        Args:
            address (str): The Ethereum address associated with the key-value pair
            key (str): The key of the key-value pair to get

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if not hash:
            raise EscrowClientError("Invalid hash")
        if url(url):
            raise EscrowClientError("Invalid URL")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Store Results",
            self._get_escrow_contract(escrow_address).functions.storeResults(url, hash),
        )

    def complete(self, escrow_address: str):
        """Sets the status of an escrow to completed.

        Args:
            escrow_address (str): Address of the escrow to complete

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Complete", self._get_escrow_contract(escrow_address).functions.complete()
        )

    def bulk_payout(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[Decimal],
        final_results_url: str,
        final_results_hash: str,
    ):
        """Pays out the amounts specified to the workers and sets the URL of the final results file.

        Args:
            escrow_address (str): Address of the escrow
            recipients (List[str]): Array of recipient addresses
            amounts (List[Decimal]): Array of amounts the recipients will receive
            final_results_url (str): Final results file url
            final_results_hash (str): Final results file hash

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address) or not all(
            Web3.isAddress(recipient) for recipient in recipients
        ):
            raise EscrowClientError("Invalid address")
        if len(recipients) != len(amounts):
            raise EscrowClientError("Arrays must have same length")
        if 0 in amounts:
            raise EscrowClientError("Amounts cannot be empty")
        if sum(amounts) > self.get_balance(escrow_address):
            raise EscrowClientError("Escrow does not have enough balance")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")
        if url(final_results_url):
            raise EscrowClientError("Invalid URL")
        if not final_results_hash:
            raise EscrowClientError("Invalid hash")
        self._handle_transaction(
            "Bulk Payout",
            self._get_escrow_contract(escrow_address).functions.complete(),
        )

    def cancel(self, escrow_address: str):
        """Cancels the specified escrow and sends the balance to the canceler.

        Args:
            escrow_address (str): Address of the escrow to cancel

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Cancel", self._get_escrow_contract(escrow_address).functions.cancel()
        )

    def abort(self, escrow_address: str):
        """Cancels the specified escrow, sends the balance to the canceler and selfdestructs the escrow contract.

        Args:
            escrow_address (str): Address of the escrow to abort

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Abort", self._get_escrow_contract(escrow_address).functions.abort()
        )

    def add_trusted_handlers(self, escrow_address: str, handlers: List[str]):
        """Adds an array of addresses to the trusted handlers list.

        Args:
            escrow_address (str): Address of the escrow
            handlers (List[str]): Array of trusted handler addresses
        Returns:
            str: The address of the escrow created

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """
        if not Web3.isAddress(escrow_address) or not all(
            Web3.isAddress(handler) for handler in handlers
        ):
            raise EscrowClientError("Invalid address")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Add Trusted Handlers",
            self._get_escrow_contract(escrow_address).functions.addTrustedHandlers(
                handlers
            ),
        )

    def get_balance(self, escrow_address: str):
        """Gets the balance for a specified escrow address.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Decimal: Value of the balance

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return self._get_escrow_contract(escrow_address).functions.getBalance().call()

    def get_manifest_url(self, escrow_address: str):
        """Gets the manifest file URL.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Manifest file url

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return self._get_escrow_contract(escrow_address).functions.manifestUrl().call()

    def get_results_url(self, escrow_address: str):
        """Gets the results file URL.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Results file url

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return (
            self._get_escrow_contract(escrow_address).functions.finalResultsUrl().call()
        )

    def get_token_address(self, escrow_address: str):
        """Gets the address of the token used to fund the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Address of the token

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return (
            self._get_escrow_contract(escrow_address).functions.finalResultsUrl().call()
        )

    def get_token_address(self, escrow_address: str):
        """Gets the current status of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Current status

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return self._get_escrow_contract(escrow_address).functions.status().call()

    def get_launched_escrows(self, escrow_address: str):
        """Gets the current status of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Current status

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return self._get_escrow_contract(escrow_address).functions.status().call()

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
            raise EscrowClientError("Transaction failed.")

    def _get_escrow_contract(self, address: str):
        """Returns the escrow contract instance.

        Args:
            address (str): Address of the deployed escrow

        Returns:
            Contract: The instance of the escrow contract

        """
        # Initialize contract instance
        escrow_interface = get_escrow_interface()
        return self.w3.eth.contract(address=address, abi=escrow_interface["abi"])
