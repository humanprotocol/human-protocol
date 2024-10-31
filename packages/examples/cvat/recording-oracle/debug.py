import datetime

import uvicorn

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config

LOCAL_MANIFEST_FILES = set()


def apply_local_development_patches():
    """
    Applies local development patches to bypass direct source code modifications:
    - Overrides `EscrowUtils.get_escrow` to retrieve local escrow data for specific addresses,
      using mock data if the address corresponds to a local manifest.
    - Updates local manifest files from cloud storage.
    - Overrides `validate_address` to disable address validation.
    - Replaces `validate_oracle_webhook_signature` with a lenient version for oracle signature
      validation in development.
    """
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowData, EscrowUtils

    def get_local_escrow(chain_id: int, escrow_address: str) -> EscrowData:
        possible_manifest_name = escrow_address.split(":")[0]
        if possible_manifest_name in LOCAL_MANIFEST_FILES:
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
                manifest_url=f"http://127.0.0.1:9010/manifests/{possible_manifest_name}",
            )
        return original_get_escrow(ChainId(chain_id), escrow_address)

    original_get_escrow = EscrowUtils.get_escrow
    EscrowUtils.get_escrow = get_local_escrow

    from src.services import cloud
    from src.services.cloud import BucketAccessInfo

    manifests = cloud.make_client(BucketAccessInfo.parse_obj(Config.storage_config)).list_files(
        bucket="manifests"
    )
    LOCAL_MANIFEST_FILES.update(manifests)

    import src.schemas.webhook
    from src.core.types import OracleWebhookTypes

    src.schemas.webhook.validate_address = lambda x: x

    async def lenient_validate_oracle_webhook_signature(request, signature, webhook):
        from src.validators.signature import validate_oracle_webhook_signature

        try:
            return OracleWebhookTypes(signature.split(":")[0])
        except (ValueError, TypeError):
            return await validate_oracle_webhook_signature(request, signature, webhook)

    import src.endpoints.webhook

    src.endpoints.webhook.validate_oracle_webhook_signature = (
        lenient_validate_oracle_webhook_signature
    )
    import logging

    logging.warning("Local development patches applied.")


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
