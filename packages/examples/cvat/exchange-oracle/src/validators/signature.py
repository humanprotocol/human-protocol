import hmac
from ast import literal_eval
from hashlib import sha256
from http import HTTPStatus

from fastapi import HTTPException, Request

from src.chain.escrow import (
    get_available_webhook_types,
)
from src.chain.web3 import recover_signer
from src.core.config import Config
from src.core.types import OracleWebhookTypes
from src.schemas.webhook import OracleWebhook


async def validate_oracle_webhook_signature(
    request: Request, signature: str, webhook: OracleWebhook
) -> OracleWebhookTypes:
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))

    signer = recover_signer(webhook.chain_id, message, signature).lower()
    webhook_types = get_available_webhook_types(webhook.chain_id, webhook.escrow_address)

    if not (webhook_sender := webhook_types.get(signer)):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED)

    return webhook_sender


async def validate_cvat_signature(request: Request, x_signature_256: str):
    data: bytes = await request.body()
    signature = (
        "sha256="
        + hmac.new(
            Config.cvat_config.cvat_webhook_secret.encode("utf-8"),
            data,
            digestmod=sha256,
        ).hexdigest()
    )

    if not hmac.compare_digest(x_signature_256, signature):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED)


async def validate_human_app_signature(signature: str):
    if not signature == Config.human_app_config.signature:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED)
