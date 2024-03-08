from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from src.config import Config
from src.endpoints import router

logger = Config.logging.get_logger()
recording_oracle = FastAPI(title="Text Example Recording Oracle", version="0.1.0")
recording_oracle.include_router(router)


@recording_oracle.on_event("startup")
def startup():
    logger.info("Recording Oracle is up and running.")
    if Config.environment == "test":
        logger.warn(
            "You are running the server in the test environment. This might be an oversight."
        )
    logger.debug("Registering cron jobs.")
    scheduler = BackgroundScheduler()
    tasks = []
    for task in tasks:
        scheduler.add_job(
            task,
            "interval",
            seconds=Config.cron_config.task_interval,
        )

    logger.debug("All cron jobs registered successfully.")
