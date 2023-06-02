from fastapi import APIRouter, Header
from typing import Union

from .api_schema import JLWebhook, JLWebhookResponse, CvatWebhook
from src.db import SessionLocal

from src.validators.escrow import validate_escrow
from src.validators.signature import validate_signature

from .cvat.constants import EventTypes
from .cvat.handlers import handle_task_event, handle_job_event
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
    validate_signature(human_signature)
    validate_escrow(jl_webhook.network, jl_webhook.escrow_address)

    with SessionLocal.begin() as session:
        webhook_id = create_webhook(session, jl_webhook, human_signature)

    return JLWebhookResponse(id=webhook_id)


# TODO: Add CVAT signature and validate it
@router.post(
    "/cvat",
    description="Consumes a webhook from a cvat",
)
def cvat_webhook(cvat_webhook: CvatWebhook):
    match cvat_webhook.event:
        case EventTypes.create_task.value:
            handle_task_event(cvat_webhook.task)
        case EventTypes.update_job.value:
            handle_job_event(cvat_webhook)
