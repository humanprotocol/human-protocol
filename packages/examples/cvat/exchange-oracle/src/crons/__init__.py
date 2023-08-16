from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from src.core.config import Config
from src.crons.track_completed import (
    track_completed_projects,
    track_completed_tasks,
)
from src.crons.retrieve_annotations import retrieve_annotations
from src.crons.process_job_launcher_webhooks import (
    process_job_launcher_webhooks,
)
from src.crons.process_recording_oracle_webhooks import (
    process_recording_oracle_webhooks,
)


def setup_cron_jobs(app: FastAPI):
    @app.on_event("startup")
    def cron_record():
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            process_job_launcher_webhooks,
            "interval",
            seconds=Config.cron_config.process_job_launcher_webhooks_int,
        )
        scheduler.add_job(
            process_recording_oracle_webhooks,
            "interval",
            seconds=Config.cron_config.process_recording_oracle_webhooks_int,
        )
        scheduler.add_job(
            track_completed_projects,
            "interval",
            seconds=Config.cron_config.track_completed_projects_int,
        )
        scheduler.add_job(
            track_completed_tasks,
            "interval",
            seconds=Config.cron_config.track_completed_tasks_int,
        )
        scheduler.add_job(
            retrieve_annotations,
            "interval",
            seconds=Config.cron_config.retrieve_annotatons_int,
        )
        scheduler.start()
