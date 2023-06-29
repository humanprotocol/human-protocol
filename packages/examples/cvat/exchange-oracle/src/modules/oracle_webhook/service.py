import datetime
import uuid

from sqlalchemy import update, case
from sqlalchemy.sql import select
from sqlalchemy.orm import Session
from typing import List

from src.modules.oracle_webhook.constants import (
    OracleWebhookTypes,
    OracleWebhookStatuses,
)
from src.modules.oracle_webhook.model import Webhook
from src.modules.api_schema import OracleWebhook

from src.config import Config


def create_webhook(
    session: Session,
    escrow_address: str,
    chain_id: int,
    type: OracleWebhookTypes,
    signature: str,
) -> id:
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
            escrow_address=escrow_address,
            chain_id=chain_id,
            type=type,
            status=OracleWebhookStatuses.pending.value,
        )

        session.add(webhook)

        return webhook_id
    return existing_webhook.id


def get_pending_webhooks(session: Session, limit: int) -> List[Webhook]:
    webhooks = (
        session.query(Webhook)
        .where(
            Webhook.type == OracleWebhookTypes.job_launcher.value,
            Webhook.status == OracleWebhookStatuses.pending.value,
            Webhook.wait_until <= datetime.datetime.now(),
        )
        .limit(limit)
        .all()
    )
    return webhooks


def update_webhook_status(
    session: Session, webhook_id: id, status: OracleWebhookStatuses
) -> None:
    if status not in OracleWebhookStatuses.__members__.values():
        raise ValueError(f"{status} is not available")
    upd = update(Webhook).where(Webhook.id == webhook_id).values(status=status)
    session.execute(upd)


def handle_webhook_fail(session: Session, webhook_id: id) -> None:
    upd = (
        update(Webhook)
        .where(Webhook.id == webhook_id)
        .values(
            attempts=Webhook.attempts + 1,
            status=case(
                (
                    Webhook.attempts + 1 >= Config.webhook_max_retries,
                    OracleWebhookStatuses.failed.value,
                ),
                else_=OracleWebhookStatuses.pending.value,
            ),
            wait_until=Webhook.wait_until
            + datetime.timedelta(minutes=Config.webhook_delay_if_failed),
        )
    )
    session.execute(upd)
