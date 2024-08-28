import inspect
import logging
from collections.abc import Callable
from contextlib import contextmanager, nullcontext
from functools import wraps
from typing import NamedTuple

import httpx
from sqlalchemy.orm import Session

import src.services.webhook as oracle_db_service
import src.services.webhook as webhook_service
from src.core.types import OracleWebhookTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.log import get_logger_name
from src.models.webhook import Webhook
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message


class CronSpec(NamedTuple):
    manage_session: bool
    repr: str


def _validate_cron_function_signature(fn: Callable[..., None]) -> CronSpec:
    cron_repr = repr(fn.__name__)
    parameters = dict(inspect.signature(fn).parameters)

    session_param = parameters.pop("session", None)
    if session_param is not None and session_param.annotation is not Session:
        raise TypeError(f"{cron_repr} session argument type must be of type {Session.__qualname__}")

    logger_param = parameters.pop("logger", None)
    if logger_param is None or logger_param.annotation is not logging.Logger:
        raise TypeError(f"{cron_repr} must have logger argument with type of {logging.Logger}")

    if parameters:
        raise TypeError(
            f"{cron_repr} expected to have only have logger and session arguments,"
            f" not {set(parameters.keys())}"
        )

    return CronSpec(manage_session=session_param is not None, repr=cron_repr)


def cron_job(fn: Callable[..., None]) -> Callable[[], None]:
    """
    Wrapper that supplies logger and optionally session to the cron job.

    Example usage:
        >>> @cron_job
        >>> def handle_webhook(logger: logging.Logger) -> None:
        >>>     ...
    Example usage with session:
        >>> @cron_job
        >>> def handle_webhook(logger: logging.Logger, session: Session) -> None:
        >>>     ...

    Returns:
        Cron job ready to be registered in scheduler.
    """
    logger = logging.getLogger(get_logger_name(f"{fn.__module__}.{fn.__name__}"))
    cron_spec = _validate_cron_function_signature(fn)

    @wraps(fn)
    def wrapper():
        logger.debug(f"Cron {cron_spec.repr} is starting")
        try:
            if not cron_spec.manage_session:
                return fn(logger)
            with SessionLocal.begin() as session:
                return fn(logger, session)
        except Exception:
            logger.exception(f"Exception while running {cron_spec.repr} cron")
        finally:
            logger.debug(f"Cron {cron_spec.repr} finished")

    return wrapper


@contextmanager
def handle_webhook(logger: logging.Logger, session: Session, webhook: Webhook):
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
