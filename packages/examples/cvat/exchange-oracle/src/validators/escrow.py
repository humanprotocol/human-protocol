from human_protocol_sdk.constants import Status
from human_protocol_sdk.escrow import EscrowClient

from src.modules.chain.web3 import get_web3


def validate_escrow(network: str, escrow_address: str):
    web3 = get_web3(network)
    escrow_client = EscrowClient(web3)

    if escrow_client.get_balance(escrow_address) == 0:
        raise ValueError("Escrow doesn't have funds.")

    escrow_status = escrow_client.get_status(escrow_address)
    if escrow_status != Status.Pending:
        raise ValueError(
            f"Escrow is not in a Pending state. Current state: {escrow_status.name}."
        )
