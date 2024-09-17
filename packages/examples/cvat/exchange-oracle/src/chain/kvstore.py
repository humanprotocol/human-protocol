from human_protocol_sdk.constants import ChainId, KVStoreKeys
from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError, KVStoreUtils
from human_protocol_sdk.operator import OperatorUtils

from src.chain.escrow import get_escrow
from src.chain.web3 import get_web3
from src.core.config import Config


def get_recording_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.recording_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    return OperatorUtils.get_leader(ChainId(chain_id), escrow.recording_oracle).webhook_url


def get_reputation_oracle_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.recording_oracle_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    return OperatorUtils.get_leader(ChainId(chain_id), escrow.recording_oracle).webhook_url


def get_job_launcher_url(chain_id: int, escrow_address: str) -> str:
    if url := Config.localhost.job_launcher_url:
        return url

    escrow = get_escrow(chain_id, escrow_address)

    return OperatorUtils.get_leader(ChainId(chain_id), escrow.launcher).webhook_url


def register_in_kvstore() -> None:
    if Config.encryption_config.pgp_public_key_url:
        for network_config in Config.get_network_configs(only_configured=True):
            w3 = get_web3(network_config.chain_id)
            kvstore_client = KVStoreClient(w3)
            kvstore_public_key_url = None

            try:
                kvstore_public_key_url = KVStoreUtils.get_file_url_and_verify_hash(
                    network_config.chain_id, network_config.addr, KVStoreKeys.public_key.value
                )
            except KVStoreClientError as ex:
                if "Invalid hash" not in str(ex):
                    raise

            if (
                not kvstore_public_key_url
                or kvstore_public_key_url != Config.encryption_config.pgp_public_key_url
            ):
                kvstore_client.set_file_url_and_hash(
                    Config.encryption_config.pgp_public_key_url,
                    key=KVStoreKeys.public_key.value,
                )
