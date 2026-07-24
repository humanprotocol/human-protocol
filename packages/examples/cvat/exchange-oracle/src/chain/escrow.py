import json
from decimal import Decimal
from functools import partial

import httpx2
from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.encryption import Encryption, EncryptionUtils
from human_protocol_sdk.escrow import EscrowClient, EscrowData, EscrowUtils
from human_protocol_sdk.utils import validate_url

from src.chain.web3 import get_token_decimals, get_token_symbol, get_web3
from src.core.config import Config
from src.core.types import OracleWebhookTypes
from src.services.cache import Cache


class ManifestNotAvailableError(Exception):
    """Raised when the escrow manifest cannot be retrieved."""


def _get_manifest_content(manifest: str) -> str:
    if validate_url(manifest):
        try:
            response = httpx2.get(manifest, follow_redirects=True)
            response.raise_for_status()
        except Exception as e:
            raise ManifestNotAvailableError(
                f"failed to download manifest from {manifest}: {e}"
            ) from e
        return response.text

    return manifest


def get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
    escrow = EscrowUtils.get_escrow(ChainId(chain_id), escrow_address)
    if not escrow:
        raise Exception(f"Can't find escrow {escrow_address}")

    return escrow


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: list[Status] | None = None,
    allow_no_funds: bool = False,
) -> None:
    if accepted_states is None:
        accepted_states = [Status.Pending]
    assert accepted_states

    escrow = get_escrow(chain_id, escrow_address)

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

    manifest_content = _get_manifest_content(escrow.manifest)

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


def get_escrow_fund_token_decimals(chain_id: int, escrow_address: str) -> int:
    """
    ERC-20 decimals: divide the raw token amount by 10**decimals for the user representation
    (https://eips.ethereum.org/EIPS/eip-20).
    """

    escrow = get_escrow(chain_id, escrow_address)
    return get_token_decimals(chain_id, escrow.token)


def get_remaining_escrow_funds(chain_id: int, escrow_address: str) -> Decimal | None:
    web3 = get_web3(chain_id)
    client = EscrowClient(web3)

    remaining_funds = client.get_remaining_funds(escrow_address)
    if remaining_funds is None:
        return None

    token_decimals = get_escrow_fund_token_decimals(chain_id, escrow_address)
    return Decimal(remaining_funds) / Decimal(10**token_decimals)
