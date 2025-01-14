import datetime
from collections.abc import Generator
from contextlib import ExitStack, contextmanager
from logging import Logger
from unittest import mock

import uvicorn

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config
from src.services import cloud
from src.services.cloud import BucketAccessInfo
from src.utils.logging import format_sequence, get_function_logger


@contextmanager
def _mock_get_manifests_from_minio(logger: Logger) -> Generator[None, None, None]:
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowData, EscrowUtils

    minio_client = cloud.make_client(
        BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
    )
    original_get_escrow = EscrowUtils.get_escrow

    def patched_get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
        minio_manifests = minio_client.list_files(bucket="manifests")
        logger.debug(f"DEV: Local manifests: {format_sequence(minio_manifests)}")

        candidate_files = [fn for fn in minio_manifests if f"{escrow_address}.json" in fn]
        if not candidate_files:
            return original_get_escrow(ChainId(chain_id), escrow_address)
        if len(candidate_files) != 1:
            raise Exception(
                f"Can't select local manifest to be used for escrow '{escrow_address}'"
                f" - several manifests math: {format_sequence(candidate_files)}"
            )

        manifest_file = candidate_files[0]
        escrow = EscrowData(
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
            manifest_url=(f"http://{Config.storage_config.endpoint_url}/manifests/{manifest_file}"),
        )

        logger.info(f"DEV: Using local manifest '{manifest_file}' for escrow '{escrow_address}'")
        return escrow

    with mock.patch.object(EscrowUtils, "get_escrow", patched_get_escrow):
        yield


@contextmanager
def _mock_escrow_results_saving(logger: Logger) -> Generator[None, None, None]:
    def patched_store_results(
        chain_id,
        escrow_address,
        url,
        hash,
    ) -> None:
        logger.info(
            f"DEV: Would store results for escrow '{escrow_address}@{chain_id}' "
            f"on chain: {url}, {hash}"
        )

    with mock.patch("src.chain.escrow.store_results", patched_store_results):
        yield


@contextmanager
def _mock_webhook_signature_checking(_: Logger) -> Generator[None, None, None]:
    """
    Allows to receive webhooks from other services:
    - from exchange oracle -
      signed with Config.localhost.exchange_oracle_address
      or with signature "exchange_oracle<number>"
    """

    from src.chain.escrow import (
        get_available_webhook_types as original_get_available_webhook_types,
    )
    from src.core.types import OracleWebhookTypes
    from src.validators.signature import (
        validate_oracle_webhook_signature as original_validate_oracle_webhook_signature,
    )

    async def patched_validate_oracle_webhook_signature(request, signature, webhook):
        for webhook_type in OracleWebhookTypes:
            if signature.startswith(webhook_type.value.lower()):
                return webhook_type

        return await original_validate_oracle_webhook_signature(request, signature, webhook)

    def patched_get_available_webhook_types(chain_id, escrow_address):
        d = dict(original_get_available_webhook_types(chain_id, escrow_address))
        d[Config.localhost.exchange_oracle_address.lower()] = OracleWebhookTypes.exchange_oracle
        return d

    with (
        mock.patch("src.schemas.webhook.validate_address", lambda x: x),
        mock.patch(
            "src.validators.signature.get_available_webhook_types",
            patched_get_available_webhook_types,
        ),
        mock.patch(
            "src.endpoints.webhook.validate_oracle_webhook_signature",
            patched_validate_oracle_webhook_signature,
        ),
    ):
        yield


@contextmanager
def apply_local_development_patches() -> Generator[None, None, None]:
    """
    Applies local development patches to avoid manual source code modification
    """

    logger = get_function_logger(apply_local_development_patches.__name__)

    logger.warning("DEV: Applying local development patches")

    with ExitStack() as es:
        for mock_callback in (
            _mock_get_manifests_from_minio,
            _mock_webhook_signature_checking,
            _mock_escrow_results_saving,
        ):
            logger.warning(f"DEV: applying patch {mock_callback.__name__}...")
            es.enter_context(mock_callback(logger))

        logger.warning("DEV: Local development patches applied.")

        yield


if __name__ == "__main__":
    with ExitStack() as es:
        is_dev = Config.environment == "development"
        if is_dev:
            es.enter_context(apply_local_development_patches())

        Config.validate()
        register_in_kvstore()

        uvicorn.run(
            app="src:app",
            host="0.0.0.0",  # noqa: S104
            port=int(Config.port),
            workers=Config.workers_amount,
        )
