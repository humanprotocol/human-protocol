import uuid
from typing import Union
from fastapi import APIRouter, Header
from sqlalchemy.sql import select
from sqlalchemy.orm import Session
from src.db import SessionLocal
from .model import Webhook
from .api_schema import JLWebhook, JLWebhookResponse
from .constants import WebhookTypes, WebhookStatuses


router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
def save_webhook(
    jl_webhook: JLWebhook, human_signature: Union[str, None] = Header(default=None)
):
    with SessionLocal.begin() as session:
        webhook_id = create_webhook(session, jl_webhook, human_signature)

        return JLWebhookResponse(id=webhook_id)


def create_webhook(session: Session, jl_webhook: JLWebhook, signature: str):
    """
    Create a webhook received from Job Launcher. Only one webhook per escrow will be stored.
    """
    existing_webhook_query = select(Webhook).where(Webhook.signature == signature)
    existing_webhook = session.execute(existing_webhook_query).scalars().first()

    if existing_webhook is None:
        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature=signature,
            escrow_address=jl_webhook.escrow_address.lower(),
            network_id=jl_webhook.network,
            type=WebhookTypes.jl_webhook.value,
            status=WebhookStatuses.pending.value,
            url=jl_webhook.s3_url,
            # .lower() is to conform s3 bucket naming rules
            # https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
        )

        session.add(webhook)

        return webhook_id
    return existing_webhook.id
