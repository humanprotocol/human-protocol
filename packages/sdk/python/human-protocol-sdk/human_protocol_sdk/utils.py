import json
import logging
import os
import time
import re
from typing import Tuple, Optional
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
    DEFAULT_AURORA_GAS_PRICE,
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
    """Configuration for subgraph logic."""

    max_retries: Optional[int] = None
    base_delay: Optional[int] = None  # milliseconds


def is_indexer_error(error: Exception) -> bool:
    """
    Check if an error indicates that the indexer is down or not synced.
    This function specifically checks for "bad indexers" errors from The Graph.

    :param error: The error to check
    :return: True if the error indicates indexer issues
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
    network: dict,
    query: str,
    params: dict = None,
    options: Optional[SubgraphOptions] = None,
):
    """Fetch data from the subgraph with optional logic.

    :param network: Network configuration dictionary
    :param query: GraphQL query string
    :param params: Query parameters
    :param options: Optional subgraph configuration

    :return: JSON response from the subgraph

    :raise Exception: If the subgraph query fails
    """
    if not options:
        return _fetch_subgraph_data(network, query, params)

    if (
        options.max_retries is not None
        and options.base_delay is None
        or options.max_retries is None
        and options.base_delay is not None
    ):
        raise ValueError(
            "Retry configuration must include both max_retries and base_delay"
        )

    max_retries = int(options.max_retries)
    base_delay = options.base_delay / 1000

    last_error = None

    for attempt in range(max_retries + 1):
        try:
            return _fetch_subgraph_data(network, query, params)
        except Exception as error:
            last_error = error

            if not is_indexer_error(error):
                break

            delay = base_delay * attempt
            time.sleep(delay)

    raise last_error


def _fetch_subgraph_data(network: dict, query: str, params: dict = None):
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

    request = requests.post(subgraph_url, json={"query": query, "variables": params})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception(
            "Subgraph query failed. return code is {}. \n{}".format(
                request.status_code, query
            )
        )


def get_hmt_balance(wallet_addr, token_addr, w3):
    """Get HMT balance

    :param wallet_addr: wallet address
    :param token_addr: ERC-20 contract
    :param w3: Web3 instance

    :return: HMT balance (wei)
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
    """Parse a transfer transaction receipt.

    :param hmtoken_contract: The HMT token contract
    :param tx_receipt: The transaction receipt

    :return: A tuple indicating if HMT was transferred and the transaction balance
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


def get_contract_interface(contract_entrypoint):
    """Retrieve the contract interface of a given contract.

    :param contract_entrypoint: the entrypoint of the JSON.

    :return: The contract interface containing the contract abi.
    """

    with open(contract_entrypoint) as f:
        contract_interface = json.load(f)
    return contract_interface


def get_erc20_interface():
    """Retrieve the ERC20 interface.

    :return: The ERC20 interface of smart contract.
    """

    return get_contract_interface(
        "{}/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json".format(
            ARTIFACTS_FOLDER
        )
    )


def get_factory_interface():
    """Retrieve the EscrowFactory interface.

    :return: The EscrowFactory interface of smart contract.

    """

    return get_contract_interface(
        "{}/contracts/EscrowFactory.sol/EscrowFactory.json".format(ARTIFACTS_FOLDER)
    )


def get_staking_interface():
    """Retrieve the Staking interface.

    :return: The Staking interface of smart contract.

    """

    return get_contract_interface(
        "{}/contracts/Staking.sol/Staking.json".format(ARTIFACTS_FOLDER)
    )


def get_escrow_interface():
    """Retrieve the RewardPool interface.

    :return: The RewardPool interface of smart contract.

    """

    return get_contract_interface(
        "{}/contracts/Escrow.sol/Escrow.json".format(ARTIFACTS_FOLDER)
    )


def get_kvstore_interface():
    """Retrieve the KVStore interface.

    :return: The KVStore interface of smart contract.

    """

    return get_contract_interface(
        "{}/contracts/KVStore.sol/KVStore.json".format(ARTIFACTS_FOLDER)
    )


def handle_error(e, exception_class):
    """
    Handles and translates errors raised during contract transactions.

    This function captures exceptions (especially ContractLogicError from web3.py),
    extracts meaningful revert reasons if present, logs unexpected errors, and raises
    a custom exception with a clear message for SDK users.

    :param e: The exception object raised during a transaction.
    :param exception_class: The custom exception class to raise (e.g., EscrowClientError).

    :raises exception_class: With a detailed error message, including contract revert reasons if available.

    :example:
        try:
            tx_hash = contract.functions.someMethod(...).transact()
            w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, EscrowClientError)
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
    """Validates the given URL.

    :param url: Public or private URL address

    :return: True if URL is valid, False otherwise

    :raise ValidationFailure: If the URL is invalid
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
    """Validates if the given string is a valid JSON.
    :param data: String to validate
    :return: True if the string is a valid JSON, False otherwise
    """
    try:
        json.loads(data)
        return True
    except (ValueError, TypeError):
        return False


def apply_tx_defaults(w3: Web3, tx_options: Optional[TxParams]) -> TxParams:
    """Apply network specific default transaction parameters.

    Aurora networks enforce a fixed gas price. We always override any user supplied
    gasPrice with DEFAULT_AURORA_GAS_PRICE when on Aurora Testnet.
    EIP-1559 fields are removed to avoid conflicts.

    :param w3: Web3 instance (used to read chain id)
    :param tx_options: Original transaction options (can be None)
    :return: Mutated tx options with enforced defaults
    """
    opts: TxParams = dict(tx_options) if tx_options else {}
    if w3.eth.chain_id == ChainId.AURORA_TESTNET.value:
        opts["gasPrice"] = DEFAULT_AURORA_GAS_PRICE
        opts.pop("maxFeePerGas", None)
        opts.pop("maxPriorityFeePerGas", None)
    return opts
