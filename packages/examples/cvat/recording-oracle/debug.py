import datetime
import hashlib

import uvicorn

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config
from src.services import cloud
from src.services.cloud import BucketAccessInfo
from src.utils.logging import get_function_logger


def apply_local_development_patches():
    """
    Applies local development patches to bypass direct source code modifications:
    - Overrides `EscrowUtils.get_escrow` to retrieve local escrow data for specific addresses,
      using mock data if the address corresponds to a local manifest.
    - Updates local manifest files from cloud storage.
    - Overrides `validate_address` to disable address validation.
    - Replaces `validate_oracle_webhook_signature` with a lenient version for oracle signature
      validation in development.
    - Replaces `src.chain.escrow.store_results` to avoid attempting to store results on chain.
    - Replaces `src.validators.signature.validate_oracle_webhook_signature` to always return
      `OracleWebhookTypes.exchange_oracle`.
    """
    logger = get_function_logger(apply_local_development_patches.__name__)

    import src.crons._utils

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

    src.crons._utils.prepare_signed_message = prepare_signed_message

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowData, EscrowUtils

    minio_client = cloud.make_client(BucketAccessInfo.parse_obj(Config.storage_config))

    def get_local_escrow(chain_id: int, escrow_address: str) -> EscrowData:
        possible_manifest_name = escrow_address.split(":")[0]
        local_manifests = minio_client.list_files(bucket="manifests")
        logger.info(f"Local manifests: {local_manifests}")
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

    async def lenient_validate_oracle_webhook_signature(
        request,  # noqa: ARG001 (not relevant here)
        signature,
        webhook,  # noqa: ARG001 (not relevant here)
    ):
        try:
            parsed_type = OracleWebhookTypes(signature.split(":")[0])
            logger.info(f"DEV: Recovered {parsed_type} from the signature {signature}")
        except (ValueError, TypeError):
            logger.info(f"DEV: Falling back to {OracleWebhookTypes.exchange_oracle} webhook sender")
            return OracleWebhookTypes.exchange_oracle

    import src.endpoints.webhook

    src.endpoints.webhook.validate_oracle_webhook_signature = (
        lenient_validate_oracle_webhook_signature
    )

    import src.chain.escrow

    def store_results(
        chain_id: int,  # noqa: ARG001 (not relevant here)
        escrow_address: str,
        url: str,
        hash: str,
    ) -> None:
        logger.info(f"Would store results for escrow {escrow_address} on chain: {url}, {hash}")

    src.chain.escrow.store_results = store_results

    logger.warning("Local development patches applied.")


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
