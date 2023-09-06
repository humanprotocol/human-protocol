import json
import logging
import time
import re
from typing import Tuple, Optional

import requests
from validators import url as URL
from web3 import Web3
from web3.contract import Contract
from web3.types import TxReceipt

from human_protocol_sdk.constants import ARTIFACTS_FOLDER

logger = logging.getLogger("human_protocol_sdk.utils")


def with_retry(fn, retries=3, delay=5, backoff=2):
    """Retry a function

    Mainly used with handle_transaction to retry on case of failure.
    Uses expnential backoff.

     Args:
        fn: <Partial> to run with retry logic.
        retries: number of times to retry the transaction
        delay: time to wait (exponentially)
        backoff: defines the rate of grow for the exponential wait.

    Returns:
        False if transaction never succeeded, the return of the function
        otherwise

    Raises:
        No error

    NOTE:
        If the partial returns a Boolean and it happens to be False,
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
    """Get hmt balance

    Args:
        wallet_addr: wallet address
        token_addr: ERC-20 contract
        w3: Web3 instance

    Return:
        Decimal with HMT balance
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

    Args:
        contract_entrypoint: the entrypoint of the JSON.

    Returns:
        returns the contract interface containing the contract abi.

    """
    with open(contract_entrypoint) as f:
        contract_interface = json.load(f)
    return contract_interface


def get_erc20_interface():
    """Retrieve the ERC20 interface.

    Returns:
        Contract interface: returns the ERC20 interface solidity contract.

    """

    return get_contract_interface(
        "{}/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json".format(
            ARTIFACTS_FOLDER
        )
    )


def get_factory_interface():
    """Retrieve the EscrowFactory interface.

    Returns:
        Contract interface: returns the EscrowFactory interface solidity contract.

    """

    return get_contract_interface(
        "{}/contracts/EscrowFactory.sol/EscrowFactory.json".format(ARTIFACTS_FOLDER)
    )


def get_staking_interface():
    """Retrieve the Staking interface.

    Returns:
        Contract interface: returns the Staking interface solidity contract.

    """

    return get_contract_interface(
        "{}/contracts/Staking.sol/Staking.json".format(ARTIFACTS_FOLDER)
    )


def get_reward_pool_interface():
    """Retrieve the RewardPool interface.

    Returns:
        Contract interface: returns the RewardPool interface solidity contract.

    """

    return get_contract_interface(
        "{}/contracts/RewardPool.sol/RewardPool.json".format(ARTIFACTS_FOLDER)
    )


def get_escrow_interface():
    """Retrieve the RewardPool interface.

    Returns:
        Contract interface: returns the RewardPool interface solidity contract.

    """

    return get_contract_interface(
        "{}/contracts/Escrow.sol/Escrow.json".format(ARTIFACTS_FOLDER)
    )


def get_kvstore_interface():
    """Retrieve the KVStore interface.

    Returns:
        Contract interface: returns the KVStore interface solidity contract.

    """

    return get_contract_interface(
        "{}/contracts/KVStore.sol/KVStore.json".format(ARTIFACTS_FOLDER)
    )


def get_data_from_subgraph(url: str, query: str, params: dict = None):
    request = requests.post(url, json={"query": query, "variables": params})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception(
            "Subgraph query failed. return code is {}. \n{}".format(
                request.status_code, query
            )
        )


def handle_transaction(w3: Web3, tx_name, tx, exception):
    """Executes the transaction and waits for the receipt.

    Args:
        w3 (Web3): Web3 instance
        tx_name (str): Name of the transaction
        tx (obj): Transaction object
        exception (Exception): Exception class to raise in case of error

    Returns:
        obj: The transaction receipt

    Validations:
        - There must be a default account

    """
    if not w3.eth.default_account:
        raise exception("You must add an account to Web3 instance")
    if not w3.middleware_onion.get("construct_sign_and_send_raw_middleware"):
        raise exception(
            "You must add construct_sign_and_send_raw_middleware middleware to Web3 instance"
        )
    try:
        tx_hash = tx.transact()
        return w3.eth.wait_for_transaction_receipt(tx_hash)
    except Exception as e:
        if "reverted with reason string" in e.args[0]:
            start_index = e.args[0].find("'") + 1
            end_index = e.args[0].rfind("'")
            message = e.args[0][start_index:end_index]
            raise exception(f"{tx_name} transaction failed: {message}")
        else:
            raise exception(f"{tx_name} transaction failed.")


def validate_url(url: str) -> bool:
    """Gets the url string.
    Args:
        url (str): Public or private url address
    Returns:
        bool: Returns True if url is valid
    Raises:
        ValidationFailure: If the url is invalid
    """

    # validators.url tracks docker network URL as ivalid
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
