import datetime
import uuid

from sqlalchemy import update, case
from sqlalchemy.sql import select
from sqlalchemy.orm import Session
from src.modules.oracle_webhooks.constants import WebhookStatuses, WebhookTypes
from src.modules.oracle_webhooks.model import Webhook
from src.modules.api_schema import JLWebhook

from src.config import Config


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


def update_webhook_status(session: Session, webhook_id: id, status: WebhookStatuses):
    if status not in WebhookStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Webhook).where(Webhook.id == webhook_id).values(status=status)
    session.execute(upd)


def handle_webhook_fail(session: Session, webhook_id: id):
    upd = (
        update(Webhook)
        .where(Webhook.id == webhook_id)
        .values(
            attempts=Webhook.attempts + 1,
            status=case(
                (Webhook.attempts + 1 >= Config.webhook_max_retries, "failed"),
                else_=WebhookStatuses.pending,
            ),
            wait_until=Webhook.wait_until
            + datetime.timedelta(minutes=Config.webhook_delay_if_failed),
        )
    )
    session.execute(upd)
