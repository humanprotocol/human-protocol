import datetime
import json
from collections.abc import Generator
from contextlib import ExitStack, contextmanager
from logging import Logger
from pathlib import Path
from typing import Any
from unittest import mock

import uvicorn
from httpx import URL

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config
from src.db import SessionLocal
from src.services import cloud
from src.services import cvat as cvat_service
from src.services.cloud import BucketAccessInfo
from src.utils.logging import format_sequence, get_function_logger


@contextmanager
def _mock_cvat_cloud_storage_params(logger: Logger) -> Generator[None, None, None]:
    from src.handlers.job_creation import (
        _make_cvat_cloud_storage_params as original_make_cvat_cloud_storage_params,
    )

    def patched_make_cvat_cloud_storage_params(bucket_info: BucketAccessInfo) -> dict:
        original_host_url = bucket_info.host_url

        if Config.development_config.cvat_in_docker:
            bucket_info.host_url = str(
                URL(original_host_url).copy_with(
                    host=Config.development_config.exchange_oracle_host
                )
            )
            logger.info(
                f"DEV: Changed {original_host_url} to {bucket_info.host_url} for CVAT storage"
            )

        try:
            return original_make_cvat_cloud_storage_params(bucket_info)
        finally:
            bucket_info.host_url = original_host_url

    with mock.patch(
        "src.handlers.job_creation._make_cvat_cloud_storage_params",
        patched_make_cvat_cloud_storage_params,
    ):
        yield


@contextmanager
def _mock_get_manifests_from_minio(logger: Logger) -> Generator[None, None, None]:
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowData, EscrowUtils

    minio_client = cloud.make_client(BucketAccessInfo.parse_obj(Config.storage_config))
    original_get_escrow = EscrowUtils.get_escrow

    def patched_get_escrow(chain_id: int, escrow_address: str) -> EscrowData:
        minio_manifests = minio_client.list_files(bucket="manifests")
        logger.debug(f"DEV: Local manifests: {format_sequence(minio_manifests)}")

        candidate_files = [fn for fn in minio_manifests if f"{escrow_address}.json" in fn]
        if not candidate_files:
            return original_get_escrow(ChainId(chain_id), escrow_address)
        elif len(candidate_files) != 1:
            raise Exception(
                "Can't select local manifest to be used for escrow '{}'"
                " - several manifests math: {}".format(
                    escrow_address, format_sequence(candidate_files)
                )
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
def _mock_webhook_signature_checking(_: Logger) -> Generator[None, None, None]:
    """
    Allows to receive webhooks from other services:
    - from launcher - with signature "job_launcher<number>"
    - from recording oracle -
      encoded with Config.localhost.recording_oracle_address wallet address
      or signature "recording_oracle<number>"
    - from reputation oracle -
      encoded with Config.localhost.reputation_oracle_address wallet address
      or signature "reputation_oracle<number>"
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
        d[Config.localhost.recording_oracle_address.lower()] = OracleWebhookTypes.recording_oracle
        d[Config.localhost.reputation_oracle_address.lower()] = OracleWebhookTypes.reputation_oracle
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
def _mock_endpoint_auth(logger: Logger) -> Generator[None, None, None]:
    """
    Allows simplified authentication:
    - Bearer {"wallet_address": "...", "email": "..."}
    - Bearer {"role": "human_app"}
    """

    from src.endpoints.authentication import HUMAN_APP_ROLE, TokenAuthenticator

    original_decode_token = TokenAuthenticator._decode_token

    def decode_plain_json_token(self, token) -> dict[str, Any]:
        try:
            token_data = json.loads(token)

            if (user_wallet := token_data.get("wallet_address")) and not token_data.get("email"):
                with SessionLocal.begin() as session:
                    user = cvat_service.get_user_by_id(session, user_wallet)
                    if not user:
                        raise Exception(f"Could not find user with wallet address '{user_wallet}'")

                    token_data["email"] = user.cvat_email

            if token_data.get("role") == HUMAN_APP_ROLE:
                token_data["wallet_address"] = None
                token_data["email"] = ""

            logger.info(f"DEV: Decoded plain JSON auth token: {token_data}")
            return token_data
        except (ValueError, TypeError):
            return original_decode_token(self, token)

    with mock.patch.object(TokenAuthenticator, "_decode_token", decode_plain_json_token):
        yield


@contextmanager
def _mock_human_app_keys(_: Logger) -> Generator[None, None, None]:
    "Creates or uses local Human App JWT keys"

    from tests.api.test_exchange_api import generate_ecdsa_keys

    # generating keys for local development
    repo_root = Path(__file__).parent
    dev_dir = repo_root / "dev"
    dev_dir.mkdir(exist_ok=True)

    human_app_private_key_file = dev_dir / "human_app_private_key.pem"
    human_app_public_key_file = dev_dir / "human_app_public_key.pem"

    if not (human_app_public_key_file.exists() and human_app_private_key_file.exists()):
        private_key, public_key = generate_ecdsa_keys()
        human_app_private_key_file.write_text(private_key)
        human_app_public_key_file.write_text(public_key)
    else:
        public_key = human_app_public_key_file.read_text()

    Config.human_app_config.jwt_public_key = public_key

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
            _mock_cvat_cloud_storage_params,
            _mock_get_manifests_from_minio,
            _mock_webhook_signature_checking,
            _mock_endpoint_auth,
            _mock_human_app_keys,
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
