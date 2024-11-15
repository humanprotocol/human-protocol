"""Config for the application logger"""

import logging
from collections.abc import Sequence
from logging.config import dictConfig
from typing import Any

from src.core.config import Config

ROOT_LOGGER_NAME = "app"


def get_logger_name(module_name: str) -> str:
    return f"{ROOT_LOGGER_NAME}.{module_name.removeprefix('src.')}"


def setup_logging():
    log_level_name = logging.getLevelName(
        Config.loglevel or (logging.DEBUG if Config.is_development_mode() else logging.INFO)
    )

    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "uvicorn.logging.DefaultFormatter",
                "fmt": "%(levelprefix)s %(asctime)s [%(name)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
                "use_colors": True,
            },
        },
        "handlers": {
            "console": {
                "formatter": "default",
                "class": "logging.StreamHandler",
            },
        },
        "loggers": {
            ROOT_LOGGER_NAME: {
                "handlers": ["console"],
                "level": log_level_name,
                "propagate": False,
            },
        },
    }

    dictConfig(log_config)


def get_root_logger() -> logging.Logger:
    return logging.getLogger(ROOT_LOGGER_NAME)


def format_sequence(items: Sequence[Any], *, max_items: int = 5, separator: str = ", ") -> str:
    remainder_count = len(items) - max_items
    tail = f" (and {remainder_count} more)" if remainder_count > 0 else ""
    return f"{separator.join(map(str, items[:max_items]))}{tail}"
