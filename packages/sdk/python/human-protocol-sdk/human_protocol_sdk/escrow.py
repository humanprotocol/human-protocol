#!/usr/bin/env python3

import datetime
import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId, Role, Status
from human_protocol_sdk.utils import (
    get_data_from_subgraph,
    get_escrow_interface,
    get_factory_interface,
    get_erc20_interface,
    handle_transaction,
)
from web3 import Web3, contract
from web3.middleware import geth_poa_middleware

from .utils import validate_url

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
            skip_manifest_url_validation (bool): Identify wether validate manifest_url
        """
        if not Web3.is_address(recording_oracle_address):
            raise EscrowClientError(
                f"Invalid recording oracle address: {recording_oracle_address}"
            )
        if not Web3.is_address(reputation_oracle_address):
            raise EscrowClientError(
                f"Invalid reputation oracle address: {reputation_oracle_address}"
            )
        if not (0 <= recording_oracle_fee <= 100) or not (
            0 <= reputation_oracle_fee <= 100
        ):
            raise EscrowClientError("Fee must be between 0 and 100")
        if recording_oracle_fee + reputation_oracle_fee > 100:
            raise EscrowClientError("Total fee must be less than 100")
        if not validate_url(manifest_url):
            raise EscrowClientError(f"Invalid manifest URL: {manifest_url}")
        if not hash:
            raise EscrowClientError("Invalid empty manifest hash")

        self.recording_oracle_address = recording_oracle_address
        self.reputation_oracle_address = reputation_oracle_address
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle_fee = reputation_oracle_fee
        self.manifest_url = manifest_url
        self.hash = hash


class EscrowFilter:
    """
    A class used to filter escrow requests.
    """

    def __init__(
        self,
        launcher: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        status: Optional[Status] = None,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
    ):
        """
        Initializes a EscrowFilter instance.

        Args:
            launcher (Optional[str]): Launcher address
            reputation_oracle (Optional[str]): Reputation oracle address
            recording_oracle (Optional[str]): Recording oracle address
            status (Optional[Status]): Escrow status
            date_from (Optional[datetime.datetime]): Created from date
            date_to (Optional[datetime.datetime]): Created to date
        """
        if launcher and not Web3.is_address(launcher):
            raise EscrowClientError(f"Invalid address: {launcher}")

        if reputation_oracle and not Web3.is_address(reputation_oracle):
            raise EscrowClientError(f"Invalid address: {reputation_oracle}")

        if recording_oracle and not Web3.is_address(recording_oracle):
            raise EscrowClientError(f"Invalid address: {recording_oracle}")

        if date_from and date_to and date_from > date_to:
            raise EscrowClientError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        self.launcher = launcher
        self.reputation_oracle = reputation_oracle
        self.recording_oracle = recording_oracle
        self.status = status
        self.date_from = date_from
        self.date_to = date_to


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

        chain_id = None
        # Load network configuration based on chainId
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
        self, token_address: str, trusted_handlers: List[str], job_requester_id: str
    ) -> str:
        """
        Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

        Args:
            tokenAddress (str): The address of the token to use for payouts
            trusted_handlers (List[str]): Array of addresses that can perform actions on the contract
            job_requester_id (str): The id of the job requester

        Returns:
            str: The address of the escrow created

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
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
        )
        return next(
            (
                self.factory_contract.events.LaunchedV2().process_log(log)
                for log in transaction_receipt["logs"]
                if log["address"] == self.network["factory_address"]
            ),
            None,
        ).args.escrow

    def setup(self, escrow_address: str, escrow_config: EscrowConfig) -> None:
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

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Setup",
            self._get_escrow_contract(escrow_address).functions.setup(
                escrow_config.reputation_oracle_address,
                escrow_config.recording_oracle_address,
                escrow_config.reputation_oracle_fee,
                escrow_config.recording_oracle_fee,
                escrow_config.manifest_url,
                escrow_config.hash,
            ),
            EscrowClientError,
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

        Args:
            token_address (str): Token to use for pay outs
            trusted_handlers (List[str]): Array of addresses that can perform actions on the contract
            job_requester_id (str): The id of the job requester
            escrow_config (EscrowConfig): Object containing all the necessary information to setup an escrow

        Returns:
            str: The address of the escrow created

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        escrow_address = self.create_escrow(
            token_address, trusted_handlers, job_requester_id
        )
        self.setup(escrow_address, escrow_config)

        return escrow_address

    def fund(self, escrow_address: str, amount: Decimal) -> None:
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
        )

    def store_results(self, escrow_address: str, url: str, hash: str) -> None:
        """Stores the results url.

        Args:
            escrow_address (str): Address of the escrow
            url (str): Results file url
            hash (str): Results file hash

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
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
        )

    def complete(self, escrow_address: str) -> None:
        """Sets the status of an escrow to completed.

        Args:
            escrow_address (str): Address of the escrow to complete

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Complete",
            self._get_escrow_contract(escrow_address).functions.complete(),
            EscrowClientError,
        )

    def bulk_payout(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[Decimal],
        final_results_url: str,
        final_results_hash: str,
        txId: Decimal,
    ) -> None:
        """Pays out the amounts specified to the workers and sets the URL of the final results file.

        Args:
            escrow_address (str): Address of the escrow
            recipients (List[str]): Array of recipient addresses
            amounts (List[Decimal]): Array of amounts the recipients will receive
            final_results_url (str): Final results file url
            final_results_hash (str): Final results file hash
            txId (Decimal): Serial number of the bulks

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
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
        )

    def cancel(self, escrow_address: str) -> None:
        """Cancels the specified escrow and sends the balance to the canceler.

        Args:
            escrow_address (str): Address of the escrow to cancel

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Cancel",
            self._get_escrow_contract(escrow_address).functions.cancel(),
            EscrowClientError,
        )

    def abort(self, escrow_address: str) -> None:
        """Cancels the specified escrow, sends the balance to the canceler and selfdestructs the escrow contract.

        Args:
            escrow_address (str): Address of the escrow to abort

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        handle_transaction(
            self.w3,
            "Abort",
            self._get_escrow_contract(escrow_address).functions.abort(),
            EscrowClientError,
        )

    def add_trusted_handlers(self, escrow_address: str, handlers: List[str]) -> None:
        """Adds an array of addresses to the trusted handlers list.

        Args:
            escrow_address (str): Address of the escrow
            handlers (List[str]): Array of trusted handler addresses

        Returns:
            None

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
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
        )

    def get_balance(self, escrow_address: str) -> Decimal:
        """Gets the balance for a specified escrow address.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Decimal: Value of the balance

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.getBalance().call()

    def get_manifest_hash(self, escrow_address: str) -> str:
        """Gets the manifest file hash.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Manifest file hash

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestHash().call()

    def get_manifest_url(self, escrow_address: str) -> str:
        """Gets the manifest file URL.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Manifest file url

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestUrl().call()

    def get_results_url(self, escrow_address: str) -> str:
        """Gets the results file URL.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Results file url

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.finalResultsUrl().call()
        )

    def get_intermediate_results_url(self, escrow_address: str) -> str:
        """Gets the intermediate results file URL.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Intermediate results file url

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
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

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Address of the token

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.token().call()

    def get_status(self, escrow_address: str) -> Status:
        """Gets the current status of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            Status: Current status

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return Status(
            self._get_escrow_contract(escrow_address).functions.status().call()
        )

    def get_escrows(self, filter: EscrowFilter = EscrowFilter()) -> List[dict]:
        """Get an array of escrow addresses based on the specified filter parameters.

        Args:
            filter (EscrowFilter): Object containing all the necessary parameters to filter

        Returns:
            List[dict]: List of escrows
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrows_query,
        )

        escrows_data = get_data_from_subgraph(
            self.network["subgraph_url"],
            query=get_escrows_query(filter),
            params={
                "launcher": filter.launcher,
                "reputationOracle": filter.reputation_oracle,
                "recordingOracle": filter.recording_oracle,
                "status": filter.status.name if filter.status else None,
                "from": int(filter.date_from.timestamp()) if filter.date_from else None,
                "to": int(filter.date_to.timestamp()) if filter.date_to else None,
            },
        )
        escrows = escrows_data["data"]["escrows"]

        return escrows

    def get_recording_oracle_address(self, escrow_address: str) -> str:
        """Gets the recording oracle address of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Recording oracle address

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.recordingOracle().call()
        )

    def get_reputation_oracle_address(self, escrow_address: str) -> str:
        """Gets the reputation oracle address of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Reputation oracle address

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.reputationOracle()
            .call()
        )

    def get_job_launcher_address(self, escrow_address: str) -> str:
        """Gets the job launcher address of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Job launcher address

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.launcher().call()

    def get_factory_address(self, escrow_address: str) -> str:
        """Gets the escrow factory address of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Escrow factory address

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.escrowFactory().call()
        )

    def _get_escrow_contract(self, address: str) -> contract:
        """Returns the escrow contract instance.

        Args:
            address (str): Address of the deployed escrow

        Returns:
            Contract: The instance of the escrow contract

        """

        if not self.factory_contract.functions.hasEscrow(address):
            raise EscrowClientError("Escrow address is not provided by the factory")
        # Initialize contract instance
        escrow_interface = get_escrow_interface()
        return self.w3.eth.contract(address=address, abi=escrow_interface["abi"])
