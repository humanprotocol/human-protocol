from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI

from src.core.config import Config
from src.crons.process_exchange_oracle_webhooks import (
    process_incoming_exchange_oracle_webhook_escrow_recorded,
    process_incoming_exchange_oracle_webhooks,
    process_outgoing_exchange_oracle_webhooks,
)
from src.crons.process_reputation_oracle_webhooks import process_outgoing_reputation_oracle_webhooks


def setup_cron_jobs(app: FastAPI):
    @app.on_event("startup")
    def cron_record():
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            process_incoming_exchange_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_exchange_oracle_webhooks_int,
        )
        scheduler.add_job(
            process_incoming_exchange_oracle_webhook_escrow_recorded,
            "interval",
            seconds=Config.cron_config.process_exchange_oracle_webhooks_int,
        )
        scheduler.add_job(
            process_outgoing_exchange_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_exchange_oracle_webhooks_int,
        )
        scheduler.add_job(
            process_outgoing_reputation_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_reputation_oracle_webhooks_int,
        )
        scheduler.start()
