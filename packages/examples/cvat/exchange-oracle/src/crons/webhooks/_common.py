import logging
from collections.abc import Callable
from contextlib import contextmanager

import httpx
from sqlalchemy.orm import Session

from src.core.types import OracleWebhookTypes
from src.db.utils import ForUpdateParams
from src.models.webhook import Webhook
from src.services import webhook as webhook_service
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message


@contextmanager
def handle_webhook(
    logger: logging.Logger,
    session: Session,
    webhook: Webhook,
    *,
    on_fail: Callable[[Session, Webhook, Exception], None] = lambda _s, _w, _e: None,
):
    logger.debug(
        "Processing webhook "
        f"{webhook.type}.{webhook.event_type}~{webhook.signature} "
        f"in escrow_address={webhook.escrow_address} "
        f"(attempt {webhook.attempts + 1})"
    )
    savepoint = session.begin_nested()
    try:
        yield
    except Exception as e:
        savepoint.rollback()
        logger.exception(f"Webhook {webhook.id} sending failed: {e}")
        savepoint = session.begin_nested()
        try:
            on_fail(session, webhook, e)
        except Exception:
            savepoint.rollback()
            raise
        finally:
            webhook_service.outbox.handle_webhook_fail(session, webhook.id)
    else:
        webhook_service.outbox.handle_webhook_success(session, webhook.id)
        logger.debug("Webhook handled successfully")


def _send_webhook(url: str, webhook: Webhook, *, with_timestamp: bool = True) -> None:
    body = prepare_outgoing_webhook_body(
        webhook.escrow_address,
        webhook.chain_id,
        webhook.event_type,
        webhook.event_data,
        timestamp=webhook.created_at if with_timestamp else None,
    )
    _, signature = prepare_signed_message(
        webhook.escrow_address,
        webhook.chain_id,
        body=body,
    )
    headers = {"human-signature": signature}
    with httpx.Client() as client:
        response = client.post(url, headers=headers, json=body)
        response.raise_for_status()


def process_outgoing_webhooks(
    logger: logging.Logger,
    session: Session,
    webhook_type: OracleWebhookTypes,
    url_getter: Callable[[int, str], str],
    chunk_size: int,
    *,
    with_timestamp: bool = True,
):
    webhooks = webhook_service.outbox.get_pending_webhooks(
        session,
        webhook_type,
        limit=chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )
    for webhook in webhooks:
        with handle_webhook(logger, session, webhook):
            webhook_url = url_getter(webhook.chain_id, webhook.escrow_address)
            _send_webhook(webhook_url, webhook, with_timestamp=with_timestamp)
