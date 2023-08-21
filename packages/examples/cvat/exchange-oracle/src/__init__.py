import logging
from fastapi import FastAPI

from src.api import init_api
from src.handlers.error_handlers import setup_error_handlers
from src.crons import setup_cron_jobs
from src.core.config import Config


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


is_test = Config.environment == "test"
if not is_test:
    setup_cron_jobs(app)
