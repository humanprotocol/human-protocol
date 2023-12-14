import src.cron_jobs as cron_jobs
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from src.config import Config
from src.endpoints import router

logger = Config.logging.get_logger()
exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")
exchange_oracle.include_router(router)


@exchange_oracle.on_event("startup")
def startup():
    logger.info("Exchange Oracle is up and running.")
    if Config.environment == "test":
        logger.warn(
            "You are running the server in the test environment. This might be an oversight."
        )
    logger.debug("Registering cron jobs.")
    scheduler = BackgroundScheduler()
    tasks = [
        cron_jobs.process_pending_job_requests,
        cron_jobs.process_in_progress_job_requests,
        cron_jobs.process_completed_job_requests,
        cron_jobs.upload_completed_job_requests,
        cron_jobs.notify_recording_oracle,
    ]
    for task in tasks:
        scheduler.add_job(
            task,
            "interval",
            seconds=Config.cron_config.task_interval,
        )

    logger.debug("All cron jobs registered successfully.")
