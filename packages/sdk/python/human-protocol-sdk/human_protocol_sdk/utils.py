import json
import logging
import os
import time
import re
from typing import Tuple, Optional

import requests
from validators import url as URL
from web3 import Web3
from web3.contract import Contract
from web3.types import TxReceipt
from web3.exceptions import ContractLogicError
from web3.types import TxParams
from web3.middleware import SignAndSendRawMiddlewareBuilder

from human_protocol_sdk.constants import ARTIFACTS_FOLDER, SUBGRAPH_API_KEY_PLACEHOLDER

logger = logging.getLogger("human_protocol_sdk.utils")

# Try to load environment variables from the .env file if python-dotenv is available
try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except ImportError:
    pass


def with_retry(fn, retries=3, delay=5, backoff=2):
    """Retry a function

    Mainly used with handle_transaction to retry on case of failure.
    Uses exponential backoff.

    :param fn: <Partial> to run with retry logic.
    :param retries: number of times to retry the transaction
    :param delay: time to wait (exponentially)
    :param backoff: defines the rate of grow for the exponential wait.

    :return: False if transaction never succeeded,
        otherwise the return of the function

    :note: If the partial returns a Boolean and it happens to be False,
        we would not know if the tx succeeded and it will retry.
    """

    wait_time = delay

    for i in range(retries):
        try:
            result = fn()
            if result:
                return result
        except Exception as e:
            name = getattr(fn, "__name__", "partial")
            logger.warning(
                f"(x{i+1}) {name} exception: {e}. Retrying after {wait_time} sec..."
            )

        time.sleep(wait_time)
        wait_time *= backoff

    return False


def get_hmt_balance(wallet_addr, token_addr, w3):
    """Get HMT balance

    :param wallet_addr: wallet address
    :param token_addr: ERC-20 contract
    :param w3: Web3 instance

    :return: Decimal with HMT balance
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


def get_data_from_subgraph(network: dict, query: str, params: dict = None):
    """Fetch data from the subgraph.

    :param network: Network configuration dictionary
    :param query: GraphQL query string
    :param params: Query parameters

    :return: JSON response from the subgraph

    :raise Exception: If the subgraph query fails
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

    request = requests.post(subgraph_url, json={"query": query, "variables": params})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception(
            "Subgraph query failed. return code is {}. \n{}".format(
                request.status_code, query
            )
        )


def handle_transaction(
    w3: Web3, tx_name: str, tx, exception: Exception, tx_options: Optional[TxParams]
):
    """Executes the transaction and waits for the receipt.

    :param w3: Web3 instance
    :param tx_name: Name of the transaction
    :param tx: Transaction object
    :param exception: Exception class to raise in case of error
    :param tx_options: (Optional) Additional transaction parameters
        - If provided, can include values like 'gas', 'gas_price', 'nonce', etc
        - If 'gas' is not specified or is None, it will be estimated using tx.estimate_gas()

    :return: The transaction receipt

    :validate:
        - There must be a default account

    :raise exception: If the transaction fails
    """
    if not w3.eth.default_account:
        raise exception("You must add an account to Web3 instance")
    if not w3.middleware_onion.get("SignAndSendRawMiddlewareBuilder"):
        raise exception(
            "You must add SignAndSendRawMiddlewareBuilder middleware to Web3 instance"
        )
    try:
        if tx_options and tx_options.get("gas") is None:
            tx_options["gas"] = tx.estimate_gas()
        elif tx_options is None:
            tx_options = {"gas": tx.estimate_gas()}
        tx_hash = tx.transact(tx_options)
        return w3.eth.wait_for_transaction_receipt(tx_hash)
    except ContractLogicError as e:
        start_index = e.args[0].find("execution reverted: ") + len(
            "execution reverted: "
        )
        message = e.args[0][start_index:]
        raise exception(f"{tx_name} transaction failed: {message}")
    except Exception as e:
        logger.exception(f"Handle transaction error: {e}")
        if "reverted with reason string" in e.args[0]:
            start_index = e.args[0].find("'") + 1
            end_index = e.args[0].rfind("'")
            message = e.args[0][start_index:end_index]
            raise exception(f"{tx_name} transaction failed: {message}")
        else:
            raise exception(f"{tx_name} transaction failed.")


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
