from fastapi import APIRouter, HTTPException, Header, Request
from typing import Union

from src.database import SessionLocal
from src.modules.chain.escrow import validate_escrow
from src.modules.webhook.api_schema import (
    OracleWebhook,
    OracleWebhookResponse,
)
from src.modules.webhook.constants import OracleWebhookTypes

from src.modules.webhook.service import create_webhook
from src.modules.webhook.validate_signature import validate_webhook_signature


router = APIRouter()


@router.post(
    "/exchange-oracle",
    description="Consumes a webhook from an exchange oracle",
)
async def exchange_oracle_webhook(
    webhook: OracleWebhook,
    request: Request,
    human_signature: Union[str, None] = Header(default=None),
):
    try:
        await validate_webhook_signature(request, human_signature, webhook)
        validate_escrow(webhook.chain_id, webhook.escrow_address)

        with SessionLocal.begin() as session:
            webhook_id = create_webhook(
                session,
                webhook.escrow_address,
                webhook.chain_id,
                webhook.s3_url,
                OracleWebhookTypes.exchange_oracle.value,
                human_signature,
            )

        return OracleWebhookResponse(id=webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
