from fastapi import APIRouter, HTTPException, Header
from typing import Union

from .api_schema import JLWebhook, JLWebhookResponse, CvatWebhook
from src.db import SessionLocal

from src.modules.chain.escrow import validate_escrow
from src.validators.signature import validate_signature

from .cvat.constants import EventTypes
from .cvat.handlers import handle_task_update_event, handle_job_event
from .oracle_webhooks.service import create_webhook

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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# TODO: Add CVAT signature and validate it
@router.post(
    "/cvat",
    description="Consumes a webhook from a cvat",
)
def cvat_webhook(cvat_webhook: CvatWebhook):
    try:
        match cvat_webhook.event:
            case EventTypes.update_task.value:
                handle_task_update_event(cvat_webhook)
            case EventTypes.update_job.value:
                handle_job_event(cvat_webhook)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
