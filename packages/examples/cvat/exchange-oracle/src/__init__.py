import logging

from fastapi import FastAPI

from src.core.config import Config
from src.crons import setup_cron_jobs
from src.endpoints import init_api
from src.handlers.error_handlers import setup_error_handlers
from src.log import setup_logging

setup_logging()

app = FastAPI(
    title="Human Exchange Oracle",
    description="""
        Exchange Oracle is a HUMAN oracle which main goal is to:
        1. Receive webhooks from a Job Launcher
        2. Process them and create jobs on CVAT
        3. Retrieve annotations and store them in a s3 bucket
        4. Notify recording oracle that raw annotations are ready
    """,
    version="0.1.0",
)

init_api(app)
setup_error_handlers(app)


@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("app")
    logger.info("Exchange Oracle is up and running!")


if not Config.is_test_mode():
    setup_cron_jobs(app)
