import datetime
import uuid

from sqlalchemy import update
from sqlalchemy.sql import select
from sqlalchemy.orm import Session
from src.modules.oracle_webhooks.constants import WebhookStatuses, WebhookTypes
from src.modules.oracle_webhooks.model import Webhook
from src.modules.api_schema import JLWebhook


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
            escrow_address=jl_webhook.escrow_address,
            chain_id=jl_webhook.chain_id,
            type=WebhookTypes.jl_webhook.value,
            status=WebhookStatuses.pending.value,
        )

        session.add(webhook)

        return webhook_id
    return existing_webhook.id


def get_pending_webhooks(session: Session, limit: int):
    webhooks = (
        session.query(Webhook)
        .where(
            Webhook.type == WebhookTypes.jl_webhook,
            Webhook.status == WebhookStatuses.pending,
            Webhook.wait_until <= datetime.datetime.now(),
        )
        .limit(limit)
        .all()
    )
    return webhooks
