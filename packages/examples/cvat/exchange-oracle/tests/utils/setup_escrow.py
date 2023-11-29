from decimal import Decimal

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.escrow import EscrowClient, EscrowConfig
from human_protocol_sdk.staking import StakingClient
from web3 import Web3

from tests.utils.constants import (
    DEFAULT_HASH,
    DEFAULT_URL,
    EXCHANGE_ORACLE_ADDRESS,
    EXCHANGE_ORACLE_FEE,
    RECORDING_ORACLE_ADDRESS,
    RECORDING_ORACLE_FEE,
    REPUTATION_ORACLE_ADDRESS,
    REPUTATION_ORACLE_FEE,
)

amount = Web3.toWei(1, "ether")


def create_escrow(web3: Web3):
    staking_client = StakingClient(web3)
    escrow_client = EscrowClient(web3)
    staking_client.approve_stake(amount)
    staking_client.stake(amount)
    escrow_address = escrow_client.create_and_setup_escrow(
        NETWORKS[ChainId.LOCALHOST]["hmt_address"],
        [web3.eth.default_account],
        EscrowConfig(
            RECORDING_ORACLE_ADDRESS,
            REPUTATION_ORACLE_ADDRESS,
            EXCHANGE_ORACLE_ADDRESS,
            RECORDING_ORACLE_FEE,
            REPUTATION_ORACLE_FEE,
            EXCHANGE_ORACLE_FEE,
            DEFAULT_URL,
            DEFAULT_HASH,
        ),
    )
    return escrow_address


def fund_escrow(web3: Web3, escrow_address: str):
    escrow_client = EscrowClient(web3)
    escrow_client.fund(escrow_address, amount)


def bulk_payout(web3: Web3, escrow_address: str, recipient: str, amount: Decimal):
    escrow_client = EscrowClient(web3)
    escrow_client.bulk_payout(escrow_address, [recipient], [amount], DEFAULT_URL, DEFAULT_HASH, 1)
