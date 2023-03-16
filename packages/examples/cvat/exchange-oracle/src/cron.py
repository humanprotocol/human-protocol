from typing import Callable

from fastapi import FastAPI
from fastapi_utils.tasks import repeat_every

from src.config import Config
from src.modules.webhook.process_pending import process_incoming_webhooks


def setup_cron_jobs(app: FastAPI):
    run_unless_startup(
        app, process_incoming_webhooks, Config.cron_config.process_incoming_webhooks_int
    )


def run_unless_startup(app: FastAPI, cb: Callable, duration: int) -> None:
    first_run = True

    # https://github.com/dmontagu/fastapi-utils/issues/256 repeat_every does not run without "startup" event
    @app.on_event("startup")
    @repeat_every(seconds=duration)
    def cron_record():
        # pylint: disable=global-statement
        nonlocal first_run
        if not first_run:
            cb()
        first_run = False
