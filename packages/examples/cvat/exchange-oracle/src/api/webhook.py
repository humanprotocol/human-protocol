from typing import Union

from fastapi import APIRouter, Header, HTTPException, Request
from src.chain.escrow import validate_escrow
from src.core.constants import OracleWebhookTypes
from src.db import SessionLocal
from src.schemas.webhook import OracleWebhook, OracleWebhookResponse
from src.services.webhook import create_webhook
from src.validators.signature import validate_webhook_signature

router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
async def job_launcher_webhook(
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
                OracleWebhookTypes.job_launcher.value,
                human_signature,
            )

        return OracleWebhookResponse(id=webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
