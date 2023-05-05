#!/usr/bin/env python3

import logging
import os
from decimal import Decimal
from typing import List

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.utils import (
    get_factory_interface,
    get_escrow_interface,
    get_hmtoken_interface,
)
from web3 import Web3
from web3.middleware import geth_poa_middleware
from validators import url as URL

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.escrow")


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
        recording_oracle_fee: Decimal,
        reputation_oracle_fee: Decimal,
        manifest_url: str,
        hash: str,
    ):
        """
        Initializes a Escrow instance.

        Args:
            recording_oracle_address (str): Address of the Recording Oracle
            reputation_oracle_address (str): Address of the Reputation Oracle
            recording_oracle_fee (Decimal): Fee percentage of the Recording Oracle
            reputation_oracle_fee (Decimal): Fee percentage of the Reputation Oracle
            manifest_url (str): Manifest file url
            hash (str): Manifest file hash
        """
        if not Web3.isAddress(recording_oracle_address) or not Web3.isAddress(
            reputation_oracle_address
        ):
            raise EscrowClientError("Invalid address")
        if not (0 <= recording_oracle_fee <= 100) or not (
            0 <= reputation_oracle_fee <= 100
        ):
            raise EscrowClientError("Fee must be between 0 and 100")
        if not URL(manifest_url):
            raise EscrowClientError("Invalid URL")
        if not hash:
            raise EscrowClientError("Invalid hash")

        self.recording_oracle_address = recording_oracle_address
        self.reputation_oracle_address = reputation_oracle_address
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle_fee = reputation_oracle_fee
        self.manifest_url = manifest_url
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
            self.w3.middleware_onion.inject(
                geth_poa_middleware, "geth_poa", layer=0)

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

    def create_escrow(self, token_address: str, trusted_handlers: List[str]):
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
        if not Web3.isAddress(token_address) or not all(
            Web3.isAddress(handler) for handler in trusted_handlers
        ):
            raise EscrowClientError("Invalid address")

        self._handle_transaction(
            "Create Escrow",
            self.factory_contract.functions.createEscrow(
                token_address, trusted_handlers
            ),
        )

        return self.factory_contract.functions.lastEscrow().call()

    def setup(self, escrow_address: str, escrow_config: EscrowConfig):
        """
        Sets up the parameters of the escrow.

        Args:
            escrow_address (str): Address of the escrow to setup
            escrow_config (EscrowConfig): Object containing all the necessary information to setup an escrow

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        self._handle_transaction(
            "Setup",
            self._get_escrow_contract(escrow_address).functions.setup(
                escrow_config.recording_oracle_address,
                escrow_config.reputation_oracle_address,
                escrow_config.recording_oracle_fee,
                escrow_config.reputation_oracle_fee,
                escrow_config.manifest_url,
                escrow_config.hash,
            ),
        )

    def create_and_setup_escrow(
        self,
        token_address: str,
        trusted_handlers: List[str],
        escrow_config: EscrowConfig,
    ):
        """
        Creates and sets up an escrow.

        Args:
            token_address (str): Token to use for pay outs
            trusted_handlers (List[str]): Array of addresses that can perform actions on the contract
            escrow_config (EscrowConfig): Object containing all the necessary information to setup an escrow

        Returns:
            str: The address of the escrow created

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        escrow_address = self.create_escrow(token_address, trusted_handlers)
        self.setup(escrow_address, escrow_config)

        return escrow_address

    def fund(self, escrow_address: str, amount: Decimal):
        """
        Adds funds to the escrow.

        Args:
            escrow_address (str): Address of the escrow to setup
            amount (Decimal): Amount to be added as funds

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")
        if 0 > amount:
            raise EscrowClientError("Amount must be possitive")

        token_address = self.get_token_address(escrow_address)

        hmtoken_interface = get_hmtoken_interface()
        hmtoken_contract = self.w3.eth.contract(
            token_address, abi=hmtoken_interface["abi"]
        )

        self._handle_transaction(
            "Fund",
            hmtoken_contract.functions.transfer(escrow_address, amount),
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
        if not URL(url):
            raise EscrowClientError("Invalid URL")
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")

        self._handle_transaction(
            "Store Results",
            self._get_escrow_contract(escrow_address).functions.storeResults(
                self.w3.eth.default_account, url, hash
            ),
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

        self._handle_transaction(
            "Complete", self._get_escrow_contract(
                escrow_address).functions.complete()
        )

    def bulk_payout(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[Decimal],
        final_results_url: str,
        final_results_hash: str,
        txId: Decimal,
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
        if len(recipients) == 0:
            raise EscrowClientError("Arrays must have any value")
        if 0 in amounts:
            raise EscrowClientError("Amounts cannot be empty")
        if sum(amounts) > self.get_balance(escrow_address):
            raise EscrowClientError("Escrow does not have enough balance")
        if not URL(final_results_url):
            raise EscrowClientError("Invalid URL")
        if not final_results_hash:
            raise EscrowClientError("Invalid hash")

        self._handle_transaction(
            "Bulk Payout",
            self._get_escrow_contract(escrow_address).functions.bulkPayOut(
                recipients, amounts, final_results_url, final_results_hash, txId
            ),
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

        self._handle_transaction(
            "Cancel", self._get_escrow_contract(
                escrow_address).functions.cancel()
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

        self._handle_transaction(
            "Abort", self._get_escrow_contract(
                escrow_address).functions.abort()
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
            self._get_escrow_contract(
                escrow_address).functions.finalResultsUrl().call()
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

        return self._get_escrow_contract(escrow_address).functions.token().call()

    def get_status(self, escrow_address: str):
        """Gets the current status of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Status: Current status

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.isAddress(escrow_address):
            raise EscrowClientError("Invalid address")

        return Status(
            self._get_escrow_contract(escrow_address).functions.status().call()
        )

    def _handle_transaction(self, tx_name, tx):
        """Executes the transaction and waits for the receipt.

        Args:
            tx_name (str): Name of the transaction
            tx (obj): Transaction object

        """
        if not self.w3.eth.default_account:
            raise EscrowClientError("You must add an account to Web3 instance")
        try:
            tx_hash = tx.transact()
            self.w3.eth.waitForTransactionReceipt(tx_hash)
        except Exception as e:
            LOG.exception(f"{tx_name} failed due to {e}.")
            if "reverted with reason string" in e.args[0]:
                start_index = e.args[0].find("'") + 1
                end_index = e.args[0].rfind("'")
                message = e.args[0][start_index:end_index]
                raise EscrowClientError("Transaction failed: " + message)
            else:
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
