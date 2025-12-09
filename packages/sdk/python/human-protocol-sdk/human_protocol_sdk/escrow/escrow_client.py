"""Client to perform actions on Escrow contracts and obtain information from the contracts.

Selects the network based on the Web3 chain id. Configure Web3 with an account
and signer middleware for writes; read operations work without a signer.

Examples:
    With signer:
    ```python
    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import SignAndSendRawMiddlewareBuilder
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.escrow import EscrowClient

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
    escrow_client = EscrowClient(w3)
    ```

    Read-only:

    ```python
    from eth_typing import URI
    from web3 import Web3
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.escrow import EscrowClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    escrow_client = EscrowClient(w3)
    ```
"""

import logging
from typing import Optional, List, Union

from human_protocol_sdk.constants import (
    ESCROW_BULK_PAYOUT_MAX_ITEMS,
    NETWORKS,
    ChainId,
    Status,
)
from human_protocol_sdk.utils import (
    get_escrow_interface,
    get_factory_interface,
    get_erc20_interface,
    handle_error,
    validate_json,
)
from web3 import Web3, contract
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import TxParams

from human_protocol_sdk.utils import validate_url
from human_protocol_sdk.decorators import requires_signer

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowCancel:
    """Represents the result of an escrow cancellation transaction.

    Attributes:
        txHash (str): The hash of the transaction that cancelled the escrow.
        amountRefunded (int): The amount refunded during the escrow cancellation.
    """

    def __init__(self, tx_hash: str, amount_refunded: any):
        self.txHash = tx_hash
        self.amountRefunded = amount_refunded


class EscrowWithdraw:
    """Represents the result of an escrow withdrawal transaction.

    Attributes:
        txHash (str): The hash of the transaction associated with the escrow withdrawal.
        token_address (str): The address of the token used for the withdrawal.
        withdrawn_amount (int): The amount withdrawn from the escrow.
    """

    def __init__(self, tx_hash: str, token_address: str, withdrawn_amount: any):
        self.txHash = tx_hash
        self.token_address = token_address
        self.withdrawn_amount = withdrawn_amount


class EscrowClientError(Exception):
    """Exception raised when errors occur during escrow operations."""

    pass


class EscrowConfig:
    """Configuration parameters for escrow setup.

    Attributes:
        recording_oracle_address (str): Address of the recording oracle.
        reputation_oracle_address (str): Address of the reputation oracle.
        exchange_oracle_address (str): Address of the exchange oracle.
        recording_oracle_fee (int): Recording oracle fee percentage (0-100).
        reputation_oracle_fee (int): Reputation oracle fee percentage (0-100).
        exchange_oracle_fee (int): Exchange oracle fee percentage (0-100).
        manifest (str): Manifest payload (URL or JSON string).
        hash (str): Manifest file hash.
    """

    def __init__(
        self,
        recording_oracle_address: str,
        reputation_oracle_address: str,
        exchange_oracle_address: str,
        recording_oracle_fee: int,
        reputation_oracle_fee: int,
        exchange_oracle_fee: int,
        manifest: str,
        hash: str,
    ):
        """
        Raises:
            EscrowClientError: If addresses are invalid, fees are out of range,
                total fees exceed 100%, or manifest data is invalid.
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
        if not validate_url(manifest) and not validate_json(manifest):
            raise EscrowClientError("Invalid empty manifest")
        if not hash:
            raise EscrowClientError("Invalid empty manifest hash")

        self.recording_oracle_address = recording_oracle_address
        self.reputation_oracle_address = reputation_oracle_address
        self.exchange_oracle_address = exchange_oracle_address
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle_fee = reputation_oracle_fee
        self.exchange_oracle_fee = exchange_oracle_fee
        self.manifest = manifest
        self.hash = hash


class EscrowClient:
    """A client for interacting with escrow smart contracts.

    This client provides methods to create, fund, configure, and manage escrow contracts
    on the Human Protocol network. It handles transaction signing, validation, and
    event processing for escrow operations.

    Attributes:
        w3 (Web3): Web3 instance configured for the target network.
        network (dict): Network configuration for the current chain.
        factory_contract (Contract): Contract instance for the escrow factory.
    """

    def __init__(self, web3: Web3):
        """Initialize an EscrowClient instance.

        Args:
            web3 (Web3): Web3 instance configured for the target network.
                Must have a valid provider and chain ID.

        Raises:
            EscrowClientError: If chain ID is invalid or network configuration is missing.
        """

        # Initialize web3 instance
        self.w3 = web3
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
                raise EscrowClientError(f"Invalid ChainId: {chain_id}")
            else:
                raise EscrowClientError(f"Invalid Web3 Instance")

        # Initialize contract instances
        factory_interface = get_factory_interface()
        self.factory_contract = self.w3.eth.contract(
            address=self.network["factory_address"], abi=factory_interface["abi"]
        )

    @requires_signer
    def create_escrow(
        self,
        token_address: str,
        job_requester_id: str,
        tx_options: Optional[TxParams] = None,
    ) -> str:
        """Create a new escrow contract.

        Args:
            token_address (str): ERC-20 token address to fund the escrow.
            job_requester_id (str): Off-chain identifier for the job requester.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            Address of the newly created escrow contract.

        Raises:
            EscrowClientError: If the token address is invalid or the transaction fails.

        Example:
            ```python
            escrow_address = escrow_client.create_escrow(
                "0x1234567890abcdef1234567890abcdef12345678",
                "job-requester",
            )
            ```
        """
        if not Web3.is_address(token_address):
            raise EscrowClientError(f"Invalid token address: {token_address}")

        try:
            tx_hash = self.factory_contract.functions.createEscrow(
                token_address, job_requester_id
            ).transact(tx_options)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            event = next(
                (
                    self.factory_contract.events.LaunchedV2().process_log(log)
                    for log in receipt["logs"]
                    if log["address"] == self.network["factory_address"]
                ),
                None,
            )
            return event.args.escrow if event else None
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def create_fund_and_setup_escrow(
        self,
        token_address: str,
        amount: int,
        job_requester_id: str,
        escrow_config: EscrowConfig,
        tx_options: Optional[TxParams] = None,
    ) -> str:
        """Create, fund, and configure an escrow in a single transaction.

        This is a convenience method that combines escrow creation, funding, and setup
        into one atomic operation.

        Args:
            token_address (str): ERC-20 token address to fund the escrow.
            amount (int): Token amount to fund (in token's smallest unit).
            job_requester_id (str): Off-chain identifier for the job requester.
            escrow_config (EscrowConfig): Escrow configuration parameters including
                oracle addresses, fees, and manifest data.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            Address of the newly created and configured escrow contract.

        Raises:
            EscrowClientError: If inputs are invalid or the transaction fails.

        Example:
            ```python
            escrow_address = escrow_client.create_fund_and_setup_escrow(
                "0x1234567890abcdef1234567890abcdef12345678",
                Web3.to_wei(5, "ether"),
                "job-requester",
                escrow_config,
            )
            ```
        """
        if not Web3.is_address(token_address):
            raise EscrowClientError(f"Invalid token address: {token_address}")

        try:
            tx_hash = self.factory_contract.functions.createFundAndSetupEscrow(
                token_address,
                amount,
                job_requester_id,
                escrow_config.reputation_oracle_address,
                escrow_config.recording_oracle_address,
                escrow_config.exchange_oracle_address,
                escrow_config.reputation_oracle_fee,
                escrow_config.recording_oracle_fee,
                escrow_config.exchange_oracle_fee,
                escrow_config.manifest,
                escrow_config.hash,
            ).transact(tx_options)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            event = next(
                (
                    self.factory_contract.events.LaunchedV2().process_log(log)
                    for log in receipt["logs"]
                    if log["address"] == self.network["factory_address"]
                ),
                None,
            )
            return event.args.escrow if event else None
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def setup(
        self,
        escrow_address: str,
        escrow_config: EscrowConfig,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Set escrow roles, fees, and manifest metadata.

        Configures the escrow with oracle addresses, fee percentages, and manifest information.

        Args:
            escrow_address (str): Address of the escrow contract to configure.
            escrow_config (EscrowConfig): Escrow configuration parameters including
                oracle addresses, fees, and manifest data.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If the escrow address is invalid or the transaction fails.

        Example:
            ```python
            escrow_client.setup("0xYourEscrow", escrow_config)
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        try:
            tx_hash = (
                self._get_escrow_contract(escrow_address)
                .functions.setup(
                    escrow_config.reputation_oracle_address,
                    escrow_config.recording_oracle_address,
                    escrow_config.exchange_oracle_address,
                    escrow_config.reputation_oracle_fee,
                    escrow_config.recording_oracle_fee,
                    escrow_config.exchange_oracle_fee,
                    escrow_config.manifest,
                    escrow_config.hash,
                )
                .transact(tx_options)
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def fund(
        self,
        escrow_address: str,
        amount: int,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Add funds to the escrow.

        Transfers tokens from the caller's account to the escrow contract.

        Args:
            escrow_address (str): Address of the escrow to fund.
            amount (int): Amount of tokens to transfer (must be positive, in token's smallest unit).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If inputs are invalid or the transfer fails.

        Example:
            ```python
            amount = Web3.to_wei(5, "ether")
            escrow_client.fund("0x62dD51230A30401C455c8398d06F85e4EaB6309f", amount)
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        if amount <= 0:
            raise EscrowClientError("Amount must be positive")

        token_address = self.get_token_address(escrow_address)
        erc20_interface = get_erc20_interface()
        token_contract = self.w3.eth.contract(token_address, abi=erc20_interface["abi"])

        try:
            tx_hash = token_contract.functions.transfer(
                escrow_address, amount
            ).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def store_results(
        self,
        escrow_address: str,
        url: str,
        hash: str,
        funds_to_reserve: Optional[int] = None,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Store results URL and hash, with optional funds reservation.

        Stores the intermediate or final results location and hash. Optionally reserves
        funds for future payouts.

        Args:
            escrow_address (str): Address of the escrow.
            url (str): Results file URL.
            hash (str): Results file hash.
            funds_to_reserve (Optional[int]): Optional funds to reserve for payouts.
                If None, uses legacy signature without reservation.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If validation fails or the transaction reverts.

        Example:
            ```python
            escrow_client.store_results(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                "http://localhost/results.json",
                "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079",
            )
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        if funds_to_reserve is not None and funds_to_reserve < 0:
            raise EscrowClientError("Amount must be positive")

        allow_empty = funds_to_reserve is not None and funds_to_reserve == 0
        if not allow_empty:
            if funds_to_reserve is None and not url:
                raise EscrowClientError("URL is empty")
            if not validate_url(url):
                raise EscrowClientError(f"Invalid URL: {url}")
            if not hash:
                raise EscrowClientError("Invalid empty hash")

        contract = self._get_escrow_contract(escrow_address)
        try:
            if funds_to_reserve is not None:
                tx_hash = contract.functions.storeResults(
                    url, hash, funds_to_reserve
                ).transact(tx_options)
            else:
                tx_hash = contract.functions.storeResults(url, hash).transact(
                    tx_options
                )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            error_text = str(e) or ""
            if "DEPRECATED_SIGNATURE" in error_text and funds_to_reserve is None:
                raise EscrowClientError(
                    "Invalid store_results parameters for the contract version of the specified escrow address"
                ) from e

            LOG.warning(
                "There may be a mismatch between the parameters passed and the expected parameters of the escrow contract version"
            )
            handle_error(e, EscrowClientError)

    @requires_signer
    def complete(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> None:
        """Set the status of an escrow to completed.

        Marks the escrow as completed, preventing further modifications.

        Args:
            escrow_address (str): Address of the escrow to complete.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If validation fails or the transaction reverts.

        Example:
            ```python
            escrow_client.complete("0x62dD51230A30401C455c8398d06F85e4EaB6309f")
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        try:
            tx_hash = (
                self._get_escrow_contract(escrow_address)
                .functions.complete()
                .transact(tx_options)
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def bulk_payout(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[int],
        final_results_url: str,
        final_results_hash: str,
        payout_id: Union[str, int],
        force_complete: bool,
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """Distribute payouts to recipients and set final results.

        Performs bulk payment distribution to multiple recipients and records the final
        results URL and hash.

        Args:
            escrow_address (str): Address of the escrow.
            recipients (List[str]): List of recipient addresses.
            amounts (List[int]): Token amounts for each recipient (in token's smallest unit).
            final_results_url (str): Final results file URL.
            final_results_hash (str): Final results file hash.
            payout_id (Union[str, int]): Payout identifier. String for newer contracts,
                integer transaction ID for older contracts.
            force_complete (bool): Whether to force completion after payout (if supported).
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If validation fails or the transaction reverts.

        Example:
            ```python
            escrow_client.bulk_payout(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
                [Web3.to_wei(5, "ether")],
                "http://localhost/results.json",
                "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079",
                payout_id="payout-1",
                force_complete=True,
            )
            ```
        """
        self.ensure_correct_bulk_payout_input(
            escrow_address, recipients, amounts, final_results_url, final_results_hash
        )

        contract = self._get_escrow_contract(escrow_address)
        try:
            if isinstance(payout_id, str):
                tx_hash = contract.functions.bulkPayOut(
                    recipients,
                    amounts,
                    final_results_url,
                    final_results_hash,
                    payout_id,
                    force_complete,
                ).transact(tx_options)
            else:
                tx_id = payout_id
                tx_hash = contract.functions.bulkPayOut(
                    recipients,
                    amounts,
                    final_results_url,
                    final_results_hash,
                    tx_id,
                    force_complete,
                ).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            error_text = str(e) or ""
            if "DEPRECATED_SIGNATURE" in error_text and not isinstance(payout_id, str):
                raise EscrowClientError(
                    "Invalid bulk_payout parameters for the contract version of the specified escrow address"
                ) from e

            LOG.warning(
                "There may be a mismatch between the parameters passed and the expected parameters of the escrow contract version"
            )
            handle_error(e, EscrowClientError)

    def create_bulk_payout_transaction(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[int],
        final_results_url: str,
        final_results_hash: str,
        payoutId: str,
        force_complete: Optional[bool] = False,
        tx_options: Optional[TxParams] = None,
    ) -> TxParams:
        """Prepare an unsigned bulk payout transaction.

        Creates a transaction dictionary that can be signed and sent externally.
        Useful for offline signing or custom transaction handling.

        Args:
            escrow_address (str): Address of the escrow.
            recipients (List[str]): List of recipient addresses.
            amounts (List[int]): Token amounts for each recipient (in token's smallest unit).
            final_results_url (str): Final results file URL.
            final_results_hash (str): Final results file hash.
            payoutId (str): Unique identifier for the payout (string signature).
            force_complete (Optional[bool]): Whether to force completion after payout. Defaults to False.
            tx_options (Optional[TxParams]): Optional transaction parameters to seed the transaction.

        Returns:
            A populated transaction dictionary ready to sign and send,
                including nonce, gas estimate, gas price/fees, and chain ID.

        Raises:
            EscrowClientError: If validation fails.

        Example:
            ```python
            tx = escrow_client.create_bulk_payout_transaction(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
                [Web3.to_wei(5, "ether")],
                "http://localhost/results.json",
                "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079",
                "payout-1",
                force_complete=False,
            )
            signed = w3.eth.account.sign_transaction(tx, "PRIVATE_KEY")
            w3.eth.send_raw_transaction(signed.raw_transaction)
            ```
        """
        self.ensure_correct_bulk_payout_input(
            escrow_address, recipients, amounts, final_results_url, final_results_hash
        )

        transaction = (
            self._get_escrow_contract(escrow_address)
            .functions.bulkPayOut(
                recipients,
                amounts,
                final_results_url,
                final_results_hash,
                payoutId,
                force_complete,
            )
            .build_transaction(tx_options or {})
        )

        # Add nonce if not provided
        if "nonce" not in transaction:
            transaction["nonce"] = self.w3.eth.get_transaction_count(
                self.w3.eth.default_account
            )

        # Add estimated gas
        if "gas" not in transaction:
            transaction["gas"] = self.w3.eth.estimate_gas(transaction)

        # Handle gas price and EIP-1559 fee fields
        if "maxFeePerGas" in transaction or "maxPriorityFeePerGas" in transaction:
            # Remove `gasPrice` if EIP-1559 fields are present
            transaction.pop("gasPrice", None)
        else:
            # Use `gasPrice` if not provided
            transaction.setdefault("gasPrice", self.w3.eth.gas_price)

        # Add chain ID
        transaction["chainId"] = self.w3.eth.chain_id

        return transaction

    def ensure_correct_bulk_payout_input(
        self,
        escrow_address: str,
        recipients: List[str],
        amounts: List[int],
        final_results_url: str,
        final_results_hash: str,
    ) -> None:
        """Validate inputs for bulk payout operations.

        Performs comprehensive validation of all bulk payout parameters including
        address validity, array lengths, amounts, and escrow balance.

        Args:
            escrow_address (str): Address of the escrow.
            recipients (List[str]): List of recipient addresses.
            amounts (List[int]): Token amounts for each recipient (in token's smallest unit).
            final_results_url (str): Final results file URL.
            final_results_hash (str): Final results file hash.

        Returns:
            None

        Raises:
            EscrowClientError: If any parameter is invalid, including:
                - Invalid escrow or recipient addresses
                - Empty or mismatched arrays
                - Too many recipients (exceeds maximum)
                - Invalid amounts (negative, zero, or exceeding escrow balance)
                - Invalid URL or hash
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")
        for recipient in recipients:
            if not Web3.is_address(recipient):
                raise EscrowClientError(f"Invalid recipient address: {recipient}")
        if len(recipients) == 0:
            raise EscrowClientError("Arrays must have any value")
        if len(recipients) > ESCROW_BULK_PAYOUT_MAX_ITEMS:
            raise EscrowClientError("Too many recipients")
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

    @requires_signer
    def request_cancellation(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> None:
        """Request cancellation of the specified escrow.

        Initiates the cancellation process. If the escrow is expired, it may finalize
        immediately; otherwise, it transitions to ToCancel status.

        Args:
            escrow_address (str): Address of the escrow to request cancellation.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            None

        Raises:
            EscrowClientError: If validation fails or the transaction reverts.

        Example:
            ```python
            escrow_client.request_cancellation(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
            )
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        try:
            tx_hash = (
                self._get_escrow_contract(escrow_address)
                .functions.requestCancellation()
                .transact(tx_options)
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def cancel(
        self, escrow_address: str, tx_options: Optional[TxParams] = None
    ) -> EscrowCancel:
        """Cancel the specified escrow and refund the balance.

        Finalizes the cancellation and transfers remaining funds to the canceler.

        Args:
            escrow_address (str): Address of the escrow to cancel.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            Cancellation details including transaction hash and refunded amount.

        Raises:
            EscrowClientError: If validation fails or the transfer event is missing.

        Example:
            ```python
            escrow_cancel_data = escrow_client.cancel(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
            )
            ```
        """
        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        try:
            tx_hash = (
                self._get_escrow_contract(escrow_address)
                .functions.cancel()
                .transact(tx_options)
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)

    @requires_signer
    def withdraw(
        self,
        escrow_address: str,
        token_address: str,
        tx_options: Optional[TxParams] = None,
    ) -> EscrowWithdraw:
        """Withdraw additional tokens from the escrow.

        Withdraws tokens (other than the primary escrow token) to the canceler's address.
        Useful for recovering accidentally sent tokens.

        Args:
            escrow_address (str): Address of the escrow to withdraw from.
            token_address (str): Address of the token to withdraw.
            tx_options (Optional[TxParams]): Optional transaction parameters such as gas limit.

        Returns:
            Withdrawal details including transaction hash, token address, and amount.

        Raises:
            EscrowClientError: If validation fails or transfer event is missing.

        Example:
            ```python
            withdrawal = escrow_client.withdraw(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                "0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4",
            )
            ```
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        if not Web3.is_address(token_address):
            raise EscrowClientError(f"Invalid token address: {token_address}")

        try:
            tx_hash = (
                self._get_escrow_contract(escrow_address)
                .functions.withdraw(token_address)
                .transact(tx_options)
            )
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            amount_transferred = None
            erc20_interface = get_erc20_interface()
            token_contract = self.w3.eth.contract(
                token_address, abi=erc20_interface["abi"]
            )

            for log in receipt["logs"]:
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

            return EscrowWithdraw(
                tx_hash=receipt["transactionHash"].hex(),
                token_address=token_address,
                withdrawn_amount=amount_transferred,
            )
        except Exception as e:
            handle_error(e, EscrowClientError)

    def get_balance(self, escrow_address: str) -> int:
        """Get the remaining balance for a specified escrow.

        Queries the current available balance in the escrow that can be used for payouts.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Remaining escrow balance in token's smallest unit.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        try:
            return (
                self._get_escrow_contract(escrow_address)
                .functions.remainingFunds()
                .call()
            )
        except:
            # Use getBalance for older contracts
            pass

        return self._get_escrow_contract(escrow_address).functions.getBalance().call()

    def get_reserved_funds(self, escrow_address: str) -> int:
        """Get the reserved funds for a specified escrow.

        Queries the amount of funds that have been reserved for future payouts.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Reserved funds amount in token's smallest unit.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.reservedFunds().call()
        )

    def get_manifest_hash(self, escrow_address: str) -> str:
        """Get the manifest file hash.

        Retrieves the hash of the manifest that defines the job requirements.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Manifest file hash.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestHash().call()

    def get_manifest(self, escrow_address: str) -> str:
        """Get the manifest data.

        Retrieves the manifest URL or JSON string that defines the job requirements.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            str: Manifest data (URL or JSON string).

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.manifestUrl().call()

    def get_results_url(self, escrow_address: str) -> str:
        """Get the final results file URL.

        Retrieves the URL where final results are stored.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Final results URL.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.finalResultsUrl().call()
        )

    def get_intermediate_results_url(self, escrow_address: str) -> str:
        """Get the intermediate results file URL.

        Retrieves the URL where intermediate results are stored.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Intermediate results URL.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.intermediateResultsUrl()
            .call()
        )

    def get_intermediate_results_hash(self, escrow_address: str) -> str:
        """Get the intermediate results file hash.

        Retrieves the hash of the intermediate results file.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Intermediate results file hash.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.intermediateResultsHash()
            .call()
        )

    def get_token_address(self, escrow_address: str) -> str:
        """Get the token address used to fund the escrow.

        Retrieves the ERC-20 token contract address used for this escrow.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Token address used to fund the escrow.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.token().call()

    def get_status(self, escrow_address: str) -> Status:
        """Get the current status of the escrow.

        Retrieves the current state of the escrow (e.g., Launched, Pending, Completed).

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Current escrow status enum value.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return Status(
            self._get_escrow_contract(escrow_address).functions.status().call()
        )

    def get_recording_oracle_address(self, escrow_address: str) -> str:
        """Get the recording oracle address of the escrow.

        Retrieves the address of the oracle responsible for recording job results.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Recording oracle address.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.recordingOracle().call()
        )

    def get_reputation_oracle_address(self, escrow_address: str) -> str:
        """Get the reputation oracle address of the escrow.

        Retrieves the address of the oracle responsible for reputation tracking.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Reputation oracle address.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address)
            .functions.reputationOracle()
            .call()
        )

    def get_exchange_oracle_address(self, escrow_address: str) -> str:
        """Get the exchange oracle address of the escrow.

        Retrieves the address of the oracle responsible for exchange rate data.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Exchange oracle address.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.exchangeOracle().call()
        )

    def get_job_launcher_address(self, escrow_address: str) -> str:
        """Get the job launcher address of the escrow.

        Retrieves the address of the account that launched/created this escrow.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Job launcher address.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return self._get_escrow_contract(escrow_address).functions.launcher().call()

    def get_factory_address(self, escrow_address: str) -> str:
        """Get the escrow factory address of the escrow.

        Retrieves the address of the factory contract that created this escrow.

        Args:
            escrow_address (str): Address of the escrow.

        Returns:
            Escrow factory address.

        Raises:
            EscrowClientError: If the escrow address is invalid.
        """

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        return (
            self._get_escrow_contract(escrow_address).functions.escrowFactory().call()
        )

    def _get_escrow_contract(self, address: str) -> contract.Contract:
        """Get the escrow contract instance.

        Internal method to retrieve a contract instance for the given escrow address.
        Validates that the address is a valid escrow from the factory.

        Args:
            address (str): Address of the deployed escrow.

        Returns:
            The instance of the escrow contract.

        Raises:
            EscrowClientError: If the address is not a valid escrow from the factory.
        """

        if not self.factory_contract.functions.hasEscrow(address):
            raise EscrowClientError("Escrow address is not provided by the factory")
        # Initialize contract instance
        escrow_interface = get_escrow_interface()
        return self.w3.eth.contract(address=address, abi=escrow_interface["abi"])
