from typing import Callable

from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from src.config import Config
from src.modules.webhook.process_pending import process_incoming_webhooks


def setup_cron_jobs(app: FastAPI):
    @app.on_event("startup")
    def cron_record():
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            process_incoming_webhooks,
            "interval",
            seconds=Config.cron_config.process_incoming_webhooks_int,
        )
        scheduler.start()
