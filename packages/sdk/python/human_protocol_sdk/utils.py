import time
import logging
from typing import Tuple, Optional
from web3.contract import Contract
from web3.types import TxReceipt

logger = logging.getLogger("human_protocol_sdk.job")


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

    transfer_event = hmtoken_contract.events.Transfer().processReceipt(tx_receipt)
    logger.info(f"Transfer_event {transfer_event}.")

    hmt_transferred = bool(transfer_event)

    if hmt_transferred:
        tx_balance = transfer_event[0].get("args", {}).get("_value")

    return hmt_transferred and tx_balance is not None, tx_balance
