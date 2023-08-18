import logging
from fastapi import FastAPI

import src.log
from src.api import init_api
from src.handlers.error_handlers import setup_error_handlers
from src.crons import setup_cron_jobs
from src.core.config import Config


app = FastAPI(
    title="Human Recording Oracle",
    description="""
        Recording Oracle is a HUMAN oracle which main goal is to:
        1. Receive webhooks from an Exchange Oracle
        2. Process them and evaluate answers collected from CVAT
        3. Store evaluated answers in a s3 bucket
        4. Notify reputation oracle that final annotations are ready
    """,
    version="0.1.0",
)

init_api(app)
setup_error_handlers(app)


@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("app")
    logger.info("Recording Oracle is up and running!")


is_test = Config.environment == "test"
if not is_test:
    setup_cron_jobs(app)
