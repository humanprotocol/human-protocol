import logging
from fastapi import FastAPI

import src.log
from src.api import init_api
from src.error_handlers import setup_error_handlers


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
