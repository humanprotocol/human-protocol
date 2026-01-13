import json
import logging
import os
import time
import re
from typing import Tuple, Optional, Any, Dict, Type
from dataclasses import dataclass

import requests
from validators import url as URL
from web3 import Web3
from web3.contract import Contract
from web3.types import TxReceipt
from web3.exceptions import ContractLogicError
from web3.types import TxParams
from web3.middleware import SignAndSendRawMiddlewareBuilder

from human_protocol_sdk.constants import (
    ARTIFACTS_FOLDER,
    SUBGRAPH_API_KEY_PLACEHOLDER,
    ChainId,
)

logger = logging.getLogger("human_protocol_sdk.utils")

# Try to load environment variables from the .env file if python-dotenv is available
try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except ImportError:
    pass


@dataclass
class SubgraphOptions:
    """Configuration options for subgraph queries with retry logic and indexer routing.

    Attributes:
        max_retries (Optional[int]): Maximum number of retry attempts for failed queries. Must be paired with base_delay.
        base_delay (Optional[int]): Base delay in milliseconds between retry attempts. Must be paired with max_retries.
        indexer_id (Optional[str]): Specific indexer ID to route requests to (requires SUBGRAPH_API_KEY environment variable).
    """

    max_retries: Optional[int] = None
    base_delay: Optional[int] = None
    indexer_id: Optional[str] = None


def is_indexer_error(error: Exception) -> bool:
    """Check if an error indicates that The Graph indexer is down or not synced.

    This function inspects error responses from The Graph API to detect "bad indexers"
    messages that indicate infrastructure issues rather than query problems.

    Args:
        error (Exception): The exception to check.

    Returns:
        True if the error indicates indexer issues, False otherwise.

    Example:
        ```python
        try:
            data = custom_gql_fetch(network, query)
        except Exception as e:
            if is_indexer_error(e):
                # Retry with different indexer
                pass
        ```
    """
    if not error:
        return False

    response = getattr(error, "response", None)

    message = ""
    if response is not None:
        try:
            data = response.json()
        except Exception:
            data = None

        if isinstance(data, dict):
            errors = data.get("errors")
            if isinstance(errors, list) and errors:
                first_error = errors[0]
                if isinstance(first_error, dict):
                    message = str(first_error.get("message", ""))

    if not message:
        message = getattr(error, "message", "") or str(error) or ""

    return "bad indexers" in message.lower()


def custom_gql_fetch(
    network: Dict[str, Any],
    query: str,
    params: Optional[Dict[str, Any]] = None,
    options: Optional[SubgraphOptions] = None,
) -> Dict[str, Any]:
    """Fetch data from the subgraph with optional retry logic and indexer routing.

    Args:
        network (Dict[str, Any]): Network configuration dictionary containing subgraph URLs.
        query (str): GraphQL query string to execute.
        params (Optional[Dict[str, Any]]): Optional query parameters/variables dictionary.
        options (Optional[SubgraphOptions]): Optional subgraph configuration for retries and indexer selection.

    Returns:
        JSON response from the subgraph containing the query results.

    Raises:
        ValueError: If retry configuration is incomplete or indexer routing requires missing API key.
        Exception: If the subgraph query fails after all retry attempts.

    Example:
        ```python
        from human_protocol_sdk.constants import NETWORKS, ChainId
        from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch

        network = NETWORKS[ChainId.POLYGON_AMOY]
        query = "{ escrows(first: 10) { id address } }"

        # Simple query
        data = custom_gql_fetch(network, query)

        # With retry logic
        data = custom_gql_fetch(
            network,
            query,
            options=SubgraphOptions(max_retries=3, base_delay=1000)
        )
        ```
    """
    subgraph_api_key = os.getenv("SUBGRAPH_API_KEY", "")

    if not options:
        return _fetch_subgraph_data(network, query, params)

    has_max_retries = options.max_retries is not None
    has_base_delay = options.base_delay is not None

    if has_max_retries != has_base_delay:
        raise ValueError(
            "Retry configuration must include both max_retries and base_delay"
        )

    if options.indexer_id and not subgraph_api_key:
        raise ValueError(
            "Routing requests to a specific indexer requires SUBGRAPH_API_KEY to be set"
        )

    max_retries = int(options.max_retries) if has_max_retries else 0
    base_delay_seconds = (options.base_delay or 0) / 1000

    last_error = None

    for attempt in range(max_retries + 1):
        try:
            return _fetch_subgraph_data(network, query, params, options.indexer_id)
        except Exception as error:
            last_error = error

            if not is_indexer_error(error):
                break

            delay = base_delay_seconds * attempt
            time.sleep(delay)

    raise last_error


def _fetch_subgraph_data(
    network: Dict[str, Any],
    query: str,
    params: Optional[Dict[str, Any]] = None,
    indexer_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Internal function to fetch data from the subgraph API.

    Args:
        network (Dict[str, Any]): Network configuration dictionary containing subgraph URLs.
        query (str): GraphQL query string to execute.
        params (Optional[Dict[str, Any]]): Optional query parameters/variables dictionary.
        indexer_id (Optional[str]): Optional indexer ID to route the request to.

    Returns:
        JSON response from the subgraph.

    Raises:
        Exception: If the HTTP request fails or returns a non-200 status code.
    """
    subgraph_api_key = os.getenv("SUBGRAPH_API_KEY", "")
    if subgraph_api_key:
        subgraph_url = network["subgraph_url_api_key"].replace(
            SUBGRAPH_API_KEY_PLACEHOLDER, subgraph_api_key
        )
    else:
        logger.warning(
            "Warning: SUBGRAPH_API_KEY is not provided. It might cause issues with the subgraph."
        )
        subgraph_url = network["subgraph_url"]

    subgraph_url = _attach_indexer_id(subgraph_url, indexer_id)

    headers = (
        {"Authorization": f"Bearer {subgraph_api_key}"} if subgraph_api_key else None
    )

    request = requests.post(
        subgraph_url, json={"query": query, "variables": params}, headers=headers
    )
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception(
            "Subgraph query failed. return code is {}. \n{}".format(
                request.status_code, query
            )
        )


def _attach_indexer_id(url: str, indexer_id: Optional[str]) -> str:
    """Append indexer ID to the subgraph URL for routing.

    Args:
        url: Base subgraph URL.
        indexer_id: Optional indexer ID to append.

    Returns:
        Modified URL with indexer routing path if indexer_id is provided, otherwise the original URL.
    """
    if not indexer_id:
        return url
    return f"{url}/indexers/id/{indexer_id}"


def get_hmt_balance(wallet_addr: str, token_addr: str, w3: Web3) -> int:
    """Get the HMT token balance for a wallet address.

    Args:
        wallet_addr (str): Wallet address to check balance for.
        token_addr (str): ERC-20 token contract address.
        w3 (Web3): Web3 instance connected to the network.

    Returns:
        HMT token balance in wei.

    Example:
        ```python
        from web3 import Web3

        w3 = Web3(Web3.HTTPProvider("https://polygon-rpc.com"))
        balance = get_hmt_balance(
            "0x1234567890123456789012345678901234567890",
            "0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF",
            w3
        )
        ```
    """
    abi = [
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function",
        }
    ]
    contract = w3.eth.contract(abi=abi, address=token_addr)
    return contract.functions.balanceOf(wallet_addr).call()


def parse_transfer_transaction(
    hmtoken_contract: Contract, tx_receipt: Optional[TxReceipt]
) -> Tuple[bool, Optional[int]]:
    """Parse a transaction receipt to extract HMT transfer information.

    Args:
        hmtoken_contract: The HMT token contract instance.
        tx_receipt: Transaction receipt to parse, or None.

    Returns:
        A tuple containing:

            - bool: True if HMT was successfully transferred, False otherwise.
            - Optional[int]: The transfer amount in wei if successful, None otherwise.

    Example:
        ```python
        from web3 import Web3

        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        transferred, amount = parse_transfer_transaction(hmt_contract, tx_receipt)
        if transferred:
            print(f"Transferred {amount} wei")
        ```
    """
    hmt_transferred = False
    tx_balance = None
    if not tx_receipt:
        return hmt_transferred, tx_balance

    transfer_event = hmtoken_contract.events.Transfer().process_receipt(tx_receipt)
    logger.info(f"Transfer_event {transfer_event}.")

    hmt_transferred = bool(transfer_event)

    if hmt_transferred:
        tx_balance = transfer_event[0].get("args", {}).get("_value")

    return hmt_transferred and tx_balance is not None, tx_balance


def get_contract_interface(contract_entrypoint: str) -> Dict[str, Any]:
    """Retrieve the contract ABI and interface from a compiled artifact file.

    Args:
        contract_entrypoint (str): File path to the contract JSON artifact.

    Returns:
        Contract interface dictionary containing the ABI and other metadata.

    Example:
        ```python
        interface = get_contract_interface("artifacts/contracts/MyContract.sol/MyContract.json")
        abi = interface["abi"]
        ```
    """
    with open(contract_entrypoint) as f:
        contract_interface = json.load(f)
    return contract_interface


def get_erc20_interface() -> Dict[str, Any]:
    """Retrieve the standard ERC20 token contract interface.

    Returns:
        The ERC20 contract interface containing the ABI.

    Example:
        ```python
        erc20_interface = get_erc20_interface()
        token_contract = w3.eth.contract(address=token_address, abi=erc20_interface["abi"])
        ```
    """

    return get_contract_interface(
        "{}/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json".format(
            ARTIFACTS_FOLDER
        )
    )


def get_factory_interface() -> Dict[str, Any]:
    """Retrieve the EscrowFactory contract interface.

    Returns:
        The EscrowFactory contract interface containing the ABI.

    Example:
        ```python
        factory_interface = get_factory_interface()
        factory_contract = w3.eth.contract(address=factory_address, abi=factory_interface["abi"])
        ```
    """

    return get_contract_interface(
        "{}/contracts/EscrowFactory.sol/EscrowFactory.json".format(ARTIFACTS_FOLDER)
    )


def get_staking_interface() -> Dict[str, Any]:
    """Retrieve the Staking contract interface.

    Returns:
        The Staking contract interface containing the ABI.

    Example:
        ```python
        staking_interface = get_staking_interface()
        staking_contract = w3.eth.contract(address=staking_address, abi=staking_interface["abi"])
        ```
    """

    return get_contract_interface(
        "{}/contracts/Staking.sol/Staking.json".format(ARTIFACTS_FOLDER)
    )


def get_escrow_interface() -> Dict[str, Any]:
    """Retrieve the Escrow contract interface.

    Returns:
        The Escrow contract interface containing the ABI.

    Example:
        ```python
        escrow_interface = get_escrow_interface()
        escrow_contract = w3.eth.contract(address=escrow_address, abi=escrow_interface["abi"])
        ```
    """

    return get_contract_interface(
        "{}/contracts/Escrow.sol/Escrow.json".format(ARTIFACTS_FOLDER)
    )


def get_kvstore_interface() -> Dict[str, Any]:
    """Retrieve the KVStore contract interface.

    Returns:
        The KVStore contract interface containing the ABI.

    Example:
        ```python
        kvstore_interface = get_kvstore_interface()
        kvstore_contract = w3.eth.contract(address=kvstore_address, abi=kvstore_interface["abi"])
        ```
    """

    return get_contract_interface(
        "{}/contracts/KVStore.sol/KVStore.json".format(ARTIFACTS_FOLDER)
    )


def handle_error(e: Exception, exception_class: Type[Exception]) -> None:
    """Handle and translate errors raised during contract transactions.

    This function captures exceptions (especially ContractLogicError from web3.py),
    extracts meaningful revert reasons when present, logs unexpected errors, and raises
    a custom exception with a clear message for SDK users.

    Args:
        e (Exception): The exception object raised during a transaction.
        exception_class (Type[Exception]): The custom exception class to raise (e.g., EscrowClientError).

    Raises:
        exception_class: Always raises the provided exception class with a formatted error message.

    Example:
        ```python
        from human_protocol_sdk.escrow import EscrowClientError

        try:
            tx_hash = contract.functions.someMethod(...).transact()
            w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)
        ```
    """

    def extract_reason(msg):
        patterns = [
            r"reverted with reason string '([^']+)'",
            r"execution reverted: ([^\"']+)",
            r"Error: VM Exception while processing transaction: reverted with reason string '([^']+)'",
        ]
        for pattern in patterns:
            match = re.search(pattern, msg)
            if match:
                return match.group(1)
        return msg.strip()

    if isinstance(e, ContractLogicError):
        msg = str(e)
        msg = extract_reason(msg)
        raise exception_class(f"Contract execution failed: {msg}")
    else:
        logger.exception(f"Transaction error: {e}")
        msg = str(e)
        # If error has a 'message' attribute or dict, try to extract it
        if hasattr(e, "message"):
            msg = getattr(e, "message")
        elif (
            hasattr(e, "args")
            and e.args
            and isinstance(e.args[0], dict)
            and "message" in e.args[0]
        ):
            msg = e.args[0]["message"]
        msg = extract_reason(msg)
        raise exception_class(f"Transaction failed: {msg}")


def validate_url(url: str) -> bool:
    """Validate whether a string is a properly formatted URL.

    This function supports both standard URLs and Docker network URLs that may
    not be recognized by strict validators.

    Args:
        url: URL string to validate (e.g., "https://example.com" or "http://localhost:8080").

    Returns:
        True if the URL is valid, False otherwise.

    Raises:
        ValidationFailure: If the URL format is invalid according to the validators library.

    Example:
        ```python
        from human_protocol_sdk.utils import validate_url

        if validate_url("https://example.com"):
            print("Valid URL")
        ```
    """

    # validators.url tracks docker network URL as invalid
    pattern = re.compile(
        r"^"
        # protocol identifier
        r"(?:(?:http)://)"
        # host name
        r"(?:(?:(?:xn--[-]{0,2})|[a-z\u00a1-\uffff\U00010000-\U0010ffff0-9]-?)*"
        r"[a-z\u00a1-\uffff\U00010000-\U0010ffff0-9]+)"
        # port number
        r"(?::\d{2,5})?"
        # resource path
        r"(?:/[-a-z\u00a1-\uffff\U00010000-\U0010ffff0-9._~%!$&'()*+,;=:@/]*)?"
        # query string
        r"(?:\?\S*)?" r"$",
        re.UNICODE | re.IGNORECASE,
    )

    result = pattern.match(url)

    if not result:
        return URL(url)

    return True


def validate_json(data: str) -> bool:
    """Validate whether a string contains valid JSON data.

    Args:
        data: String to validate as JSON.

    Returns:
        True if the string is valid JSON, False otherwise.

    Example:
        ```python
        from human_protocol_sdk.utils import validate_json

        if validate_json('{"key": "value"}'):
            print("Valid JSON")
        ```
    """
    try:
        json.loads(data)
        return True
    except (ValueError, TypeError):
        return False
