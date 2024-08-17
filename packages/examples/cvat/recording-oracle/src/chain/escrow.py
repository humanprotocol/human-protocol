import json

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.encryption import Encryption
from human_protocol_sdk.escrow import EscrowClient, EscrowData, EscrowUtils
from human_protocol_sdk.storage import StorageUtils

from src.chain.web3 import get_web3
from src.core.config import Config


def get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
    escrow = EscrowUtils.get_escrow(ChainId(chain_id), escrow_address)
    if not escrow:
        raise Exception(f"Can't find escrow {escrow_address}")

    return escrow


def validate_escrow(
    chain_id: int,
    escrow_address: str,
    *,
    accepted_states: list[Status] = [Status.Pending],
    allow_no_funds: bool = False,
) -> None:
    assert accepted_states

    escrow = get_escrow(chain_id, escrow_address)

    status = Status[escrow.status]
    if status not in accepted_states:
        raise ValueError(
            "Escrow is not in any of the accepted states ({}). Current state: {}".format(
                ", ".join(s.name for s in accepted_states), status.name
            )
        )

    if status == Status.Pending and not allow_no_funds:
        if int(escrow.balance) == 0:
            raise ValueError("Escrow doesn't have funds")


def get_escrow_manifest(chain_id: int, escrow_address: str) -> dict:
    escrow = get_escrow(chain_id, escrow_address)

    manifest_content = StorageUtils.download_file_from_url(escrow.manifest_url).decode("utf-8")

    # if EncryptionUtils.is_encrypted(manifest_content):
    if is_data_encrypted(manifest_content):
        encryption = Encryption(
            Config.encryption_config.pgp_private_key,
            Config.encryption_config.pgp_passphrase,
        )
        manifest_content = encryption.decrypt(manifest_content)

    return json.loads(manifest_content)


def store_results(chain_id: int, escrow_address: str, url: str, hash: str) -> None:
    web3 = get_web3(chain_id)
    escrow_client = EscrowClient(web3)

    escrow_client.store_results(escrow_address, url, hash)


def get_reputation_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).reputation_oracle


def get_exchange_oracle_address(chain_id: int, escrow_address: str) -> str:
    return get_escrow(chain_id, escrow_address).exchange_oracle


# FUTURE-TODO: workaround until a new Human Protocol SDK version is released.
# Check wether data is encrypted without adding new dependencies (like PGPy) to Recording Oracle.
# Should be replaced with EncryptionUtils.is_encrypted method.
def is_data_encrypted(data: str) -> bool:
    normalized_data = data.strip()
    return normalized_data.startswith("-----BEGIN PGP MESSAGE-----") and normalized_data.endswith(
        "-----END PGP MESSAGE-----"
    )
