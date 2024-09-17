"""Config for the application logger"""

import logging
from logging.config import dictConfig

from src.core.config import Config

ROOT_LOGGER_NAME = "app"


def get_logger_name(module_name: str) -> str:
    return f"{ROOT_LOGGER_NAME}.{module_name.removeprefix('src.')}"


def setup_logging():
    log_level_name = logging.getLevelName(
        Config.loglevel or (logging.DEBUG if Config.environment == "development" else logging.INFO)
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
