import inspect
import logging
from collections.abc import Callable
from contextlib import contextmanager, nullcontext
from functools import wraps

import httpx
from sqlalchemy.orm import Session

import src.services.webhook as oracle_db_service
import src.services.webhook as webhook_service
from src.core.types import OracleWebhookTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.models.webhook import Webhook
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message


def cron_job(logger_name: str) -> Callable[[Callable[..., None]], Callable[[], None]]:
    """
    Wrapper that supplies logger and optionally session to the cron job.
    Example usage:
        >>> @cron_job("app.cron.webhooks")
        >>> def handle_webhook(logger: logging.Logger) -> None:
        >>>     ...
    Example usage with session:
        >>> @cron_job("app.cron.webhooks")
        >>> def handle_webhook(logger: logging.Logger, session: Session) -> None:
        >>>     ...
    Returns:
        Cron job ready to be registered in scheduler.
    """

    def decorator(fn: Callable[..., None]):
        logger = logging.getLogger(logger_name).getChild(fn.__name__)
        cron_repr = repr(fn.__name__)

        # validate signature
        parameters = dict(inspect.signature(fn).parameters)
        session_param = parameters.pop("session", None)
        if session_param is not None:
            assert (
                session_param.annotation == Session
            ), f"{cron_repr} session argument type muse be of type {Session.__qualname__}"
        logger_param = parameters.pop("logger", None)
        assert logger_param is not None, f"{cron_repr} must have logger argument"
        assert (
            logger_param.annotation == logging.Logger
        ), f"{cron_repr} logger argument type muse be of type {logging.Logger}"
        assert not parameters, (
            f"{cron_repr} expected to have only have logger and session arguments,"
            f" not {set(parameters.keys())}"
        )

        @wraps(fn)
        def wrapper():
            logger.debug(f"Cron {cron_repr} is starting")
            try:
                with SessionLocal.begin() if session_param else nullcontext() as session:
                    return fn(logger, session) if session_param else fn(logger)
            except Exception:
                logger.exception(f"Exception while running {cron_repr} cron")
            finally:
                logger.debug(f"Cron {cron_repr} finished")

        return wrapper

    return decorator


@contextmanager
def handle_webhook(logger: logging.Logger, session: Session, webhook: Webhook):
    savepoint = session.begin_nested()
    logger.debug(
        "Processing webhook "
        f"{webhook.type}.{webhook.event_type}~{webhook.signature} "
        f"in escrow_address={webhook.escrow_address} "
        f"(attempt {webhook.attempts + 1})"
    )
    try:
        yield
    except Exception as e:
        # TODO: should we rollback on any errors or just on database errors?
        savepoint.rollback()
        logger.exception(f"Webhook {webhook.id} sending failed: {e}")
        webhook_service.outbox.handle_webhook_fail(session, webhook.id)
    else:
        webhook_service.outbox.handle_webhook_success(session, webhook.id)
        logger.debug("Webhook handled successfully")


def send_webhook(url: str, webhook: Webhook, *, with_timestamp: bool = True) -> None:
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
    webhooks = oracle_db_service.outbox.get_pending_webhooks(
        session,
        webhook_type,
        limit=chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )
    for webhook in webhooks:
        with handle_webhook(logger, session, webhook):
            webhook_url = url_getter(webhook.chain_id, webhook.escrow_address)
            send_webhook(webhook_url, webhook, with_timestamp=with_timestamp)
