import logging
from sqlalchemy import update

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.cvat_calls import job_creation_process
from src.utils.escrow import check_escrow_status, get_manifest
from src.utils.helpers import parse_manifest

from .model import Webhook, WebhookStatuses
from .service import get_pending_webhooks


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
                job_creation_process(
                    webhook.escrow_address, labels, bucket_name, region
                )
                upd = (
                    update(Webhook)
                    .where(Webhook.id == webhook.id)
                    .values(status=WebhookStatuses.completed)
                )
                session.execute(upd)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
