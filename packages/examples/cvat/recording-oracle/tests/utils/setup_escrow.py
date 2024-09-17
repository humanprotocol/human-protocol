from decimal import Decimal

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.escrow import EscrowClient, EscrowConfig
from human_protocol_sdk.staking import StakingClient
from web3 import Web3

from tests.utils.constants import (
    DEFAULT_HASH,
    DEFAULT_MANIFEST_URL,
    EXCHANGE_ORACLE_ADDRESS,
    EXCHANGE_ORACLE_FEE,
    JOB_REQUESTER_ID,
    RECORDING_ORACLE_ADDRESS,
    RECORDING_ORACLE_FEE,
    REPUTATION_ORACLE_ADDRESS,
    REPUTATION_ORACLE_FEE,
)

amount = Web3.to_wei(1, "ether")


def create_escrow(web3: Web3):
    staking_client = StakingClient(web3)
    escrow_client = EscrowClient(web3)
    staking_client.approve_stake(amount)
    staking_client.stake(amount)
    return escrow_client.create_and_setup_escrow(
        token_address=NETWORKS[ChainId.LOCALHOST]["hmt_address"],
        trusted_handlers=[web3.eth.default_account],
        job_requester_id=JOB_REQUESTER_ID,
        escrow_config=EscrowConfig(
            exchange_oracle_address=EXCHANGE_ORACLE_ADDRESS,
            exchange_oracle_fee=EXCHANGE_ORACLE_FEE,
            recording_oracle_address=RECORDING_ORACLE_ADDRESS,
            recording_oracle_fee=RECORDING_ORACLE_FEE,
            reputation_oracle_address=REPUTATION_ORACLE_ADDRESS,
            reputation_oracle_fee=REPUTATION_ORACLE_FEE,
            manifest_url=DEFAULT_MANIFEST_URL,
            hash=DEFAULT_HASH,
        ),
    )


def fund_escrow(web3: Web3, escrow_address: str):
    escrow_client = EscrowClient(web3)
    escrow_client.fund(escrow_address, amount)


def bulk_payout(web3: Web3, escrow_address: str, recipient: str, amount: Decimal):
    escrow_client = EscrowClient(web3)
    escrow_client.bulk_payout(
        escrow_address, [recipient], [amount], DEFAULT_MANIFEST_URL, DEFAULT_HASH, 1
    )


def get_intermediate_results_url(web3: Web3, escrow_address: str):
    escrow_client = EscrowClient(web3)
    return (
        escrow_client._get_escrow_contract(escrow_address).functions.intermediateResultsUrl().call()
    )
