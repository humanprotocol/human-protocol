from fastapi import APIRouter, HTTPException, Header, Request
from typing import Union

from .api_schema import JLWebhook, JLWebhookResponse, CvatWebhook
from src.db import SessionLocal

from src.modules.chain.escrow import validate_escrow
from src.validators.signature import validate_signature, validate_cvat_signature

from src.modules.cvat.constants import EventTypes
from src.modules.cvat.handlers import handle_update_job_event, handle_create_job_event
from src.modules.oracle_webhooks.service import create_webhook

router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
def jl_webhook(
    jl_webhook: JLWebhook,
    human_signature: Union[str, None] = Header(default=None),
):
    try:
        validate_signature(human_signature)
        validate_escrow(jl_webhook.chain_id, jl_webhook.escrow_address)

        with SessionLocal.begin() as session:
            webhook_id = create_webhook(session, jl_webhook, human_signature)

        return JLWebhookResponse(id=webhook_id)
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
    match cvat_webhook.event:
        case EventTypes.update_job.value:
            handle_update_job_event(cvat_webhook)
        case EventTypes.create_job.value:
            handle_create_job_event(cvat_webhook)
