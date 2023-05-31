from typing import Union
from fastapi import APIRouter, Header
from src.db import SessionLocal

from .service import create_webhook
from .api_schema import JLWebhook, JLWebhookResponse

router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
def save_webhook(
    jl_webhook: JLWebhook,
    human_signature: Union[str, None] = Header(default=None),
):
    # TODO: Add escrow checks
    with SessionLocal.begin() as session:
        webhook_id = create_webhook(session, jl_webhook, human_signature)

    return JLWebhookResponse(id=webhook_id)
