from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from src.core.config import Config

from src.crons.process_exchange_oracle_webhooks import (
    process_exchange_oracle_webhooks,
)
from src.crons.process_reputation_oracle_webhooks import (
    process_reputation_oracle_webhooks,
)


def setup_cron_jobs(app: FastAPI):
    @app.on_event("startup")
    def cron_record():
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            process_exchange_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_exchange_oracle_webhooks_int,
        )
        scheduler.add_job(
            process_reputation_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_reputation_oracle_webhooks_int,
        )
        scheduler.start()
