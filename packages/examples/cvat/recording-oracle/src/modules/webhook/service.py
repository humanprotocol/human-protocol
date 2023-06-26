import datetime
import uuid

from sqlalchemy.sql import select, update
from sqlalchemy.orm import Session
from src.modules.webhook.constants import WebhookStatuses, WebhookTypes
from src.modules.webhook.model import Webhook
from src.modules.webhook.api_schema import ExchangeOracleWebhook


def create_webhook(
    session: Session, exchange_oracle_webhook: ExchangeOracleWebhook, signature: str
):
    """
    Create a webhook received from Exchange Oracle. Only one webhook per escrow will be stored.
    """
    existing_webhook_query = select(Webhook).where(Webhook.signature == signature)
    existing_webhook = session.execute(existing_webhook_query).scalars().first()

    if existing_webhook is None:
        webhook_id = str(uuid.uuid4())
        webhook = Webhook(
            id=webhook_id,
            signature=signature,
            escrow_address=exchange_oracle_webhook.escrow_address,
            chain_id=exchange_oracle_webhook.chain_id,
            type=WebhookTypes.exchange_oracle_webhook.value,
            status=WebhookStatuses.pending.value,
        )

        session.add(webhook)

        return webhook_id
    return existing_webhook.id


def get_pending_webhooks(session: Session, limit: int):
    webhooks = (
        session.query(Webhook)
        .where(
            Webhook.type == WebhookTypes.exchange_oracle_webhook,
            Webhook.status == WebhookStatuses.pending,
            Webhook.wait_until <= datetime.datetime.now(),
        )
        .limit(limit)
        .all()
    )
    return webhooks


def update_webhook_status(session: Session, id: id, status: WebhookStatuses):
    if status not in WebhookStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Webhook).where(Webhook.id == id).values(status=status)

    session.execute(upd)
