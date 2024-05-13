from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.operator import OperatorUtils

from src.chain.escrow import get_escrow
from src.core.config import Config


def get_recording_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.recording_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    return OperatorUtils.get_leader(ChainId(chain_id), escrow.recording_oracle).webhook_url


def get_job_launcher_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.job_launcher_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    return OperatorUtils.get_leader(ChainId(chain_id), escrow.launcher).webhook_url
