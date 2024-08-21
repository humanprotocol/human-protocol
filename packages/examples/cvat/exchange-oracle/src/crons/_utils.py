import inspect
import logging
from collections.abc import Callable
from contextlib import contextmanager, nullcontext
from functools import wraps

from sqlalchemy.orm import Session

import src.services.webhook as webhook_service
from src.db import SessionLocal
from src.models.webhook import Webhook


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
