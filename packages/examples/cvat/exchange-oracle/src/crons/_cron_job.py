import inspect
import logging
from collections.abc import Callable
from functools import wraps
from typing import NamedTuple

from sqlalchemy.orm import Session

from src.db import SessionLocal
from src.log import get_logger_name


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
