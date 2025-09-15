import json
from functools import partial

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.encryption import Encryption, EncryptionUtils
from human_protocol_sdk.escrow import EscrowClient, EscrowData, EscrowUtils
from human_protocol_sdk.storage import StorageUtils

from src.chain.web3 import get_token_symbol, get_web3
from src.core.config import Config
from src.core.types import OracleWebhookTypes
from src.services.cache import Cache


def download_escrow(chain_id: int, escrow_address: str) -> EscrowData:
    escrow = EscrowUtils.get_escrow(ChainId(chain_id), escrow_address)
    if not escrow:
        raise Exception(f"Can't find escrow {escrow_address}")

    # The returned value can contain invalid oracle addresses, replace them with correct ones
    w3 = get_web3(chain_id)
    escrow_client = EscrowClient(w3)
    escrow.launcher = escrow_client.get_job_launcher_address()
    escrow.exchange_oracle = escrow_client.get_exchange_oracle_address()
    escrow.recording_oracle = escrow_client.get_recording_oracle_address()
    escrow.reputation_oracle = escrow_client.get_reputation_oracle_address()

    return escrow


def get_escrow(chain_id: int, escrow_address: str, *, force_refresh: bool = False) -> EscrowData:
    def _serialize(escrow: EscrowData) -> dict:
        return escrow.__dict__

    def _deserialize(escrow_data: dict) -> EscrowData:
        return EscrowData(**escrow_data)

    cache = Cache()
    value = cache.get_or_set_escrow(
        chain_id=chain_id,
        escrow_address=escrow_address,
        set_callback=lambda: _serialize(download_escrow(chain_id, escrow_address)),
        force_refresh=force_refresh,
    )
    return _deserialize(value)


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: list[Status] | None = None,
    allow_no_funds: bool = False,
    force_refresh: bool = False,
) -> None:
    if accepted_states is None:
        accepted_states = [Status.Pending]
    assert accepted_states

    escrow = get_escrow(chain_id, escrow_address, force_refresh=force_refresh)

    status = Status[escrow.status]
    if status not in accepted_states:
        raise ValueError(
            "Escrow is not in any of the accepted states ({}). Current state: {}".format(
                ", ".join(s.name for s in accepted_states), status.name
            )
        )

    if status == Status.Pending and not allow_no_funds and int(escrow.balance) == 0:
        raise ValueError("Escrow doesn't have funds")


def download_manifest(chain_id: int, escrow_address: str) -> dict:
    escrow = get_escrow(chain_id, escrow_address)

    manifest_content = StorageUtils.download_file_from_url(escrow.manifest_url).decode("utf-8")

    if EncryptionUtils.is_encrypted(manifest_content):
        encryption = Encryption(
            Config.encryption_config.pgp_private_key,
            passphrase=Config.encryption_config.pgp_passphrase,
        )
        manifest_content = encryption.decrypt(manifest_content).decode("utf-8")

    return json.loads(manifest_content)


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    cache = Cache()
    return cache.get_or_set_manifest(
        escrow_address=escrow_address,
        chain_id=chain_id,
        set_callback=partial(download_manifest, chain_id, escrow_address),
    )


def get_available_webhook_types(
    chain_id: int, escrow_address: str
) -> dict[str, OracleWebhookTypes]:
    escrow = get_escrow(chain_id, escrow_address)
    return {
        (escrow.launcher or "").lower(): OracleWebhookTypes.job_launcher,
        (escrow.recording_oracle or "").lower(): OracleWebhookTypes.recording_oracle,
        (escrow.reputation_oracle or "").lower(): OracleWebhookTypes.reputation_oracle,
    }


def get_escrow_fund_token_symbol(chain_id: int, escrow_address: str) -> str:
    escrow = get_escrow(chain_id, escrow_address)

    cache = Cache()
    return cache.get_or_set_token_symbol(
        chain_id=chain_id,
        token_address=escrow.token,
        set_callback=partial(get_token_symbol, chain_id, escrow.token),
    )
