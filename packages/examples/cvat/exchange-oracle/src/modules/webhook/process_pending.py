import logging

from src.db import SessionLocal
from src.config import CronConfig
from src.modules.webhook.service import get_pending_webhooks

from src.utils.cvat import (
    create_cloudstorage,
    create_project,
    create_task,
    put_task_data,
)
from src.utils.escrow import check_escrow_status, get_manifest
from src.utils.helpers import parse_manifest

LOG_MODULE = "[cron][webhook][process_incoming]"


def process_incoming_webhooks() -> None:
    """
    Process incoming webhooks in a pending state:
      * Creates a job on CVAT
      * Store necessary information about jobs in a database
    """
    try:
        logger = logging.getLogger("app")
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            webhooks = get_pending_webhooks(
                session, CronConfig.process_incoming_webhooks_chunk_size
            )
            for webhook in webhooks:
                check_escrow_status(webhook.escrow_address)
                manifest = get_manifest(webhook.escrow_address)
                (bucket_name, region, labels) = parse_manifest(manifest)
                cloudstorage = create_cloudstorage(bucket_name, region)
                project = create_project(webhook.escrow_address, labels)
                task = create_task(project.id, webhook.escrow_address)
                put_task_data(task.id, cloudstorage)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
