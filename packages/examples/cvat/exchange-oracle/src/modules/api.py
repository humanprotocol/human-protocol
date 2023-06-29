from fastapi import APIRouter, HTTPException, Header, Request
from typing import Union

from src.modules.api_schema import OracleWebhook, OracleWebhookResponse, CvatWebhook
from src.db import SessionLocal

from src.modules.chain.escrow import validate_escrow
from src.validators.signature import validate_signature, validate_cvat_signature

from src.modules.cvat.handlers.webhook import cvat_webhook_handler
from src.modules.oracle_webhook.service import create_webhook
from src.modules.oracle_webhook.constants import OracleWebhookTypes

router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
def job_launcher_webhook(
    webhook: OracleWebhook,
    human_signature: Union[str, None] = Header(default=None),
):
    try:
        validate_signature(human_signature)
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


@router.post(
    "/cvat",
    description="Consumes a webhook from a cvat",
)
async def cvat_webhook(
    cvat_webhook: CvatWebhook,
    request: Request,
    x_signature_256: str = Header(),
):
    await validate_cvat_signature(request, x_signature_256)
    cvat_webhook_handler(cvat_webhook)
