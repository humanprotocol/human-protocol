import datetime

from sqlalchemy.orm import Session
from src.modules.webhook.constants import WebhookStatuses, WebhookTypes
from src.modules.webhook.model import Webhook


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
