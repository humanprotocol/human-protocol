import logging
from sqlalchemy import update

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.job_creation import job_creation_process
from src.modules.cvat.revert_job_creation import revert_job_creation
from src.modules.chain.escrow import get_escrow_manifest, validate_escrow

from .model import Webhook, WebhookStatuses
from src.modules.oracle_webhooks.service import (
    get_pending_webhooks,
    handle_webhook_fail,
    update_webhook_status,
)


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
                    validate_escrow(webhook.chain_id, webhook.escrow_address)
                    manifest = get_escrow_manifest(
                        webhook.chain_id,
                        webhook.escrow_address,
                    )
                    job_creation_process(webhook.escrow_address, manifest)
                    update_webhook_status(
                        session, webhook.id, WebhookStatuses.completed
                    )
                except Exception as e:
                    logger.error(
                        f"Webhook: {webhook.id} failed during execution. Error {e}"
                    )
                    revert_job_creation(webhook.escrow_address)
                    handle_webhook_fail(session, webhook.id)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
