import datetime
import hashlib
import json
from pathlib import Path
from typing import Any

import uvicorn
from httpx import URL

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config
from src.services import cloud
from src.services.cloud import BucketAccessInfo
from src.utils.logging import get_function_logger


def apply_local_development_patches():
    """
    Applies local development patches to avoid manual source code modification.:
    - Overrides `EscrowUtils.get_escrow` to return local escrow data with mock values if the escrow
      address matches a local manifest.
    - Loads local manifest files from cloud storage into `LOCAL_MANIFEST_FILES`.
    - Disables address validation by overriding `validate_address`.
    - Replaces `validate_oracle_webhook_signature` with a lenient version that uses
      partial signature parsing.
    - Generates ECDSA keys if not already present for local JWT signing,
      and sets the public key in `Config.human_app_config`.
    """
    import src.handlers.job_creation

    original_make_cvat_cloud_storage_params = (
        src.handlers.job_creation._make_cvat_cloud_storage_params
    )

    def patched_make_cvat_cloud_storage_params(bucket_info: BucketAccessInfo) -> dict:
        original_host_url = bucket_info.host_url

        if Config.development_config.cvat_in_docker:
            bucket_info.host_url = str(
                URL(original_host_url).copy_with(host=Config.development_config.cvat_local_host)
            )
            logger.info(
                f"DEV: Changed {original_host_url} to {bucket_info.host_url} for CVAT storage"
            )
        try:
            return original_make_cvat_cloud_storage_params(bucket_info)
        finally:
            bucket_info.host_url = original_host_url

    src.handlers.job_creation._make_cvat_cloud_storage_params = (
        patched_make_cvat_cloud_storage_params
    )

    def prepare_signed_message(
        escrow_address,
        chain_id,
        message: str | None = None,
        body: dict | None = None,
    ) -> tuple[None, str]:
        digest = hashlib.sha256(
            (escrow_address + ":".join(map(str, (chain_id, message, body)))).encode()
        ).hexdigest()
        signature = f"{OracleWebhookTypes.recording_oracle}:{digest}"
        logger.info(f"DEV: Generated patched signature {signature}")
        return None, signature

    src.utils.webhooks.prepare_signed_message = prepare_signed_message

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowData, EscrowUtils

    logger = get_function_logger(apply_local_development_patches.__name__)

    minio_client = cloud.make_client(BucketAccessInfo.parse_obj(Config.storage_config))

    def get_local_escrow(chain_id: int, escrow_address: str) -> EscrowData:
        possible_manifest_name = escrow_address.split(":")[0]
        local_manifests = minio_client.list_files(bucket="manifests")
        logger.info(f"DEV: Local manifests: {local_manifests}")
        if possible_manifest_name in local_manifests:
            logger.info(f"DEV: Using local manifest {escrow_address}")
            return EscrowData(
                chain_id=ChainId(chain_id),
                id="test",
                address=escrow_address,
                amount_paid=10,
                balance=10,
                count=1,
                factory_address="",
                launcher="",
                status="Pending",
                token="HMT",  # noqa: S106
                total_funded_amount=10,
                created_at=datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc),
                manifest_url=(
                    f"http://{Config.storage_config.endpoint_url}/manifests/{possible_manifest_name}"
                ),
            )
        return original_get_escrow(ChainId(chain_id), escrow_address)

    original_get_escrow = EscrowUtils.get_escrow
    EscrowUtils.get_escrow = get_local_escrow

    import src.schemas.webhook
    from src.core.types import OracleWebhookTypes

    src.schemas.webhook.validate_address = lambda x: x

    async def lenient_validate_oracle_webhook_signature(request, signature, webhook):
        from src.validators.signature import validate_oracle_webhook_signature

        try:
            parsed_type = OracleWebhookTypes(signature.split(":")[0])
            logger.info(f"DEV: Recovered {parsed_type} from the signature {signature}")
        except (ValueError, TypeError):
            return await validate_oracle_webhook_signature(request, signature, webhook)

    import src.endpoints.webhook

    src.endpoints.webhook.validate_oracle_webhook_signature = (
        lenient_validate_oracle_webhook_signature
    )

    import src.endpoints.authentication

    original_decode_token = src.endpoints.authentication.TokenAuthenticator._decode_token

    def decode_plain_json_token(self, token) -> dict[str, Any]:
        """
        Allows Authentication: Bearer {"wallet_address": "...", "email": "..."}
        """
        try:
            decoded = json.loads(token)
            logger.info(f"DEV: Decoded plain JSON auth token: {decoded}")
        except (ValueError, TypeError):
            return original_decode_token(self, token)

    src.endpoints.authentication.TokenAuthenticator._decode_token = decode_plain_json_token

    from tests.api.test_exchange_api import generate_ecdsa_keys

    # generating keys for local development
    repo_root = Path(__file__).parent
    human_app_private_key_file, human_app_public_key_file = (
        repo_root / "human_app_private_key.pem",
        repo_root / "human_app_public_key.pem",
    )
    if not (human_app_public_key_file.exists() and human_app_private_key_file.exists()):
        private_key, public_key = generate_ecdsa_keys()
        human_app_private_key_file.write_text(private_key)
        human_app_public_key_file.write_text(public_key)
    else:
        public_key = human_app_public_key_file.read_text()

    Config.human_app_config.jwt_public_key = public_key

    logger.warning("DEV: Local development patches applied.")


if __name__ == "__main__":
    is_dev = Config.environment == "development"
    if is_dev:
        apply_local_development_patches()

    Config.validate()
    register_in_kvstore()

    uvicorn.run(
        app="src:app",
        host="0.0.0.0",  # noqa: S104
        port=int(Config.port),
        workers=Config.workers_amount,
    )
