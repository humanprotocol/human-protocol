from human_protocol_sdk.staking import StakingClient

from src.chain.escrow import get_escrow
from src.chain.web3 import get_web3
from src.core.config import Config


def get_recording_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.recording_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    web3 = get_web3(chain_id)
    staking_client = StakingClient(web3)
    return staking_client.get_leader(escrow.recording_oracle)["webhook_url"]


def get_job_launcher_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.job_launcher_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    web3 = get_web3(chain_id)
    staking_client = StakingClient(web3)
    return staking_client.get_leader(escrow.launcher)["webhook_url"]
