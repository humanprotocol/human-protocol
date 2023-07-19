""" Config for the application logger"""
from logging.config import dictConfig

from src.config import Config

log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
            "use_colors": True,
        },
    },
    "handlers": {
        "console": {"formatter": "default", "class": "logging.StreamHandler"},
    },
    "loggers": {
        "app": {
            "handlers": ["console"],
            "level": "DEBUG" if Config.environment == "development" else "INFO",
        },
    },
}

dictConfig(log_config)
