import logging
from sqlalchemy import update

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.job_creation import job_creation_process
from src.modules.chain.escrow import get_escrow_manifest
from src.validators.escrow import validate_escrow

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
                try:
                    validate_escrow(webhook.networ_id, webhook.escrow_address)
                    manifest = get_escrow_manifest(
                        webhook.network_id,
                        webhook.escrow_address,
                    )
                    # TODO: Parse manifest file and start job creation process on CVAT
                    job_creation_process(webhook.escrow_address, manifest)
                    upd = (
                        update(Webhook)
                        .where(Webhook.id == webhook.id)
                        .values(status=WebhookStatuses.completed)
                    )
                    session.execute(upd)
                except Exception as e:
                    logger.error(
                        f"Webhook: {webhook.id} failed during execution. Error {e}"
                    )
                    upd = (
                        update(Webhook)
                        .where(Webhook.id == webhook.id)
                        .values(status=WebhookStatuses.failed)
                    )
                    session.execute(upd)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
