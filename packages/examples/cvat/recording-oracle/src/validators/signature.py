from ast import literal_eval
from http import HTTPStatus

from fastapi import HTTPException, Request

from src.chain.escrow import get_available_webhook_types
from src.chain.web3 import recover_signer
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
