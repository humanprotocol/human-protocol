#!/usr/bin/env python3

from datetime import datetime
import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId, Status
from human_protocol_sdk.filter import EscrowFilter
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
        exchange_oracle_address: str,
        recording_oracle_fee: Decimal,
        reputation_oracle_fee: Decimal,
        exchange_oracle_fee: Decimal,
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


class EscrowFilter:
    """
    A class used to filter escrow requests.
    """

    def __init__(
        self,
        networks: [List[ChainId]],
        launcher: Optional[str] = None,
        reputation_oracle: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        exchange_oracle: Optional[str] = None,
        status: Optional[Status] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ):
        """
        Initializes a EscrowFilter instance.

        Args:
            networks (List[ChainId]): Networks to request data
            launcher (Optional[str]): Launcher address
            reputation_oracle (Optional[str]): Reputation oracle address
            recording_oracle (Optional[str]): Recording oracle address
            exchange_oracle (Optional[str]): Exchange oracle address
            status (Optional[Status]): Escrow status
            date_from (Optional[datetime]): Created from date
            date_to (Optional[datetime]): Created to date
        """

        if not networks or any(
            network not in set(chain_id.value for chain_id in ChainId)
            for network in networks
        ):
            raise EscrowClientError(f"Invalid ChainId")

        if launcher and not Web3.is_address(launcher):
            raise EscrowClientError(f"Invalid address: {launcher}")

        if reputation_oracle and not Web3.is_address(reputation_oracle):
            raise EscrowClientError(f"Invalid address: {reputation_oracle}")

        if recording_oracle and not Web3.is_address(recording_oracle):
            raise EscrowClientError(f"Invalid address: {recording_oracle}")

        if exchange_oracle and not Web3.is_address(exchange_oracle):
            raise EscrowClientError(f"Invalid address: {exchange_oracle}")

        if date_from and date_to and date_from > date_to:
            raise EscrowClientError(
                f"Invalid dates: {date_from} must be earlier than {date_to}"
            )

        self.launcher = launcher
        self.reputation_oracle = reputation_oracle
        self.recording_oracle = recording_oracle
        self.exchange_oracle = exchange_oracle
        self.status = status
        self.date_from = date_from
        self.date_to = date_to
        self.networks = networks


class EscrowData:
    def __init__(
        self,
        id: str,
        address: str,
        amountPaid: str,
        balance: str,
        count: str,
        factoryAddress: str,
        launcher: str,
        status: str,
        token: str,
        totalFundedAmount: str,
        createdAt: str,
        chainId: int,
        finalResultsUrl: Optional[str] = None,
        intermediateResultsUrl: Optional[str] = None,
        manifestHash: Optional[str] = None,
        manifestUrl: Optional[str] = None,
        recordingOracle: Optional[str] = None,
        recordingOracleFee: Optional[str] = None,
        reputationOracle: Optional[str] = None,
        reputationOracleFee: Optional[str] = None,
        exchangeOracle: Optional[str] = None,
        exchangeOracleFee: Optional[str] = None,
    ):
        """
        Initializes an EscrowData instance.

        Args:
            id (str): Identifier
            address (str): Address
            amountPaid (str): Amount paid
            balance (str): Balance
            count (str): Count
            factoryAddress (str): Factory address
            launcher (str): Launcher
            status (str): Status
            token (str): Token
            totalFundedAmount (str): Total funded amount
            createdAt (str): Creation date
            chainId (int): Chain identifier
            finalResultsUrl (str, optional): Optional URL for final results.
            intermediateResultsUrl (str, optional): Optional URL for intermediate results.
            manifestHash (str, optional): Optional manifest hash.
            manifestUrl (str, optional): Optional manifest URL.
            recordingOracle (str, optional): Optional recording Oracle address.
            recordingOracleFee (str, optional): Optional recording Oracle fee.
            reputationOracle (str, optional): Optional reputation Oracle address.
            reputationOracleFee (str, optional): Optional reputation Oracle fee.
            exchangeOracle (str, optional): Optional exchange Oracle address.
            exchangeOracleFee (str, optional): Optional exchange Oracle fee.
        """

        self.id = id
        self.address = address
        self.amountPaid = amountPaid
        self.balance = balance
        self.count = count
        self.factoryAddress = factoryAddress
        self.finalResultsUrl = finalResultsUrl
        self.intermediateResultsUrl = intermediateResultsUrl
        self.launcher = launcher
        self.manifestHash = manifestHash
        self.manifestUrl = manifestUrl
        self.recordingOracle = recordingOracle
        self.recordingOracleFee = recordingOracleFee
        self.reputationOracle = reputationOracle
        self.reputationOracleFee = reputationOracleFee
        self.exchangeOracle = exchangeOracle
        self.exchangeOracleFee = exchangeOracleFee
        self.status = status
        self.token = token
        self.totalFundedAmount = totalFundedAmount
        self.createdAt = createdAt
        self.chainId = chainId


class EscrowClient:
    """
    A class used to manage escrow on the HUMAN network.
    """

    def __init__(self, web3: Web3, gas_limit: Optional[int] = None):
        """
        Initializes a Escrow instance.

        Args:
            web3 (Web3): The Web3 object
            gas_limit (int): Gas limit to be provided to transaction
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
        self.gas_limit = gas_limit

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
            self.gas_limit,
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
                escrow_config.exchange_oracle_address,
                escrow_config.reputation_oracle_fee,
                escrow_config.recording_oracle_fee,
                escrow_config.exchange_oracle_fee,
                escrow_config.manifest_url,
                escrow_config.hash,
            ),
            EscrowClientError,
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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
            self.gas_limit,
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

    def get_exchange_oracle_address(self, escrow_address: str) -> str:
        """Gets the exchange oracle address of the escrow.

        Args:
            escrow_address (str): Address of the escrow

        Returns:
            str: Exchange oracle address

        Raises:
            EscrowClientError: If an error occurs while checking the parameters
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.exchangeOracle().call()
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


class EscrowUtils:
    """
    A utility class that provides additional escrow-related functionalities.
    """

    @staticmethod
    def get_escrows(
        filter: EscrowFilter = EscrowFilter(networks=[ChainId.POLYGON_MUMBAI.value]),
    ) -> List[EscrowData]:
        """Get an array of escrow addresses based on the specified filter parameters.

        Args:
            filter (EscrowFilter): Object containing all the necessary parameters to filter

        Returns:
            List[EscrowData]: List of escrows
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrows_query,
        )

        escrows = []
        for chain_id in filter.networks:
            network = NETWORKS[ChainId(chain_id)]
            escrows_data = get_data_from_subgraph(
                network["subgraph_url"],
                query=get_escrows_query(filter),
                params={
                    "launcher": filter.launcher,
                    "reputationOracle": filter.reputation_oracle,
                    "recordingOracle": filter.recording_oracle,
                    "exchangeOracle": filter.exchange_oracle,
                    "jobRequesterId": filter.job_requester_id,
                    "status": filter.status.name if filter.status else None,
                    "from": int(filter.date_from.timestamp())
                    if filter.date_from
                    else None,
                    "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                },
            )
            escrows_raw = escrows_data["data"]["escrows"]

            escrows.extend(
                [
                    EscrowData(
                        id=escrow.get("id", ""),
                        address=escrow.get("address", ""),
                        amountPaid=escrow.get("amountPaid", ""),
                        balance=escrow.get("balance", ""),
                        count=escrow.get("count", ""),
                        factoryAddress=escrow.get("factoryAddress", ""),
                        launcher=escrow.get("launcher", ""),
                        status=escrow.get("status", ""),
                        token=escrow.get("token", ""),
                        totalFundedAmount=escrow.get("totalFundedAmount", ""),
                        createdAt=escrow.get("createdAt", ""),
                        chainId=chain_id,
                        finalResultsUrl=escrow.get("finalResultsUrl", ""),
                        intermediateResultsUrl=escrow.get("intermediateResultsUrl", ""),
                        manifestHash=escrow.get("manifestHash", ""),
                        manifestUrl=escrow.get("manifestUrl", ""),
                        recordingOracle=escrow.get("recordingOracle", ""),
                        recordingOracleFee=escrow.get("recordingOracleFee", ""),
                        reputationOracle=escrow.get("reputationOracle", ""),
                        reputationOracleFee=escrow.get("reputationOracleFee", ""),
                        exchangeOracle=escrow.get("exchangeOracle", ""),
                        exchangeOracleFee=escrow.get("exchangeOracleFee", ""),
                    )
                    for escrow in escrows_raw
                ]
            )

        return escrows

    @staticmethod
    def get_escrow(
        chain_id: ChainId,
        escrow_address: str,
    ) -> Optional[EscrowData]:
        """Returns the escrow for a given address.

        Args:
            chain_id (ChainId): Network in which the escrow has been deployed
            escrow_address (str): Address of the escrow

        Returns:
            Optional[EscrowData]: Escrow data
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrow_query,
        )

        if chain_id not in set(chain_id.value for chain_id in ChainId):
            raise EscrowClientError(f"Invalid ChainId")

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        network = NETWORKS[ChainId(chain_id)]

        escrow = get_data_from_subgraph(
            network["subgraph_url"],
            query=get_escrow_query(),
            params={
                "escrowAddress": escrow_address,
            },
        )

        escrow_raw = escrow["data"]["escrow"]

        if not escrow_raw:
            return None

        return EscrowData(
            id=escrow_raw.get("id", ""),
            address=escrow_raw.get("address", ""),
            amountPaid=escrow_raw.get("amountPaid", ""),
            balance=escrow_raw.get("balance", ""),
            count=escrow_raw.get("count", ""),
            factoryAddress=escrow_raw.get("factoryAddress", ""),
            launcher=escrow_raw.get("launcher", ""),
            status=escrow_raw.get("status", ""),
            token=escrow_raw.get("token", ""),
            totalFundedAmount=escrow_raw.get("totalFundedAmount", ""),
            createdAt=escrow_raw.get("createdAt", ""),
            chainId=chain_id,
            finalResultsUrl=escrow_raw.get("finalResultsUrl", ""),
            intermediateResultsUrl=escrow_raw.get("intermediateResultsUrl", ""),
            manifestHash=escrow_raw.get("manifestHash", ""),
            manifestUrl=escrow_raw.get("manifestUrl", ""),
            recordingOracle=escrow_raw.get("recordingOracle", ""),
            recordingOracleFee=escrow_raw.get("recordingOracleFee", ""),
            reputationOracle=escrow_raw.get("reputationOracle", ""),
            reputationOracleFee=escrow_raw.get("reputationOracleFee", ""),
            exchangeOracle=escrow_raw.get("exchangeOracle", ""),
            exchangeOracleFee=escrow_raw.get("exchangeOracleFee", ""),
        )
