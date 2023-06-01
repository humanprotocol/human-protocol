import logging
from sqlalchemy import update
from web3 import Web3

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.job_creation import job_creation_process
from src.utils.escrow import get_escrow_manifest
from src.utils.helpers import get_web3

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
                    manifest = get_escrow_manifest(
                        get_web3(webhook.network_id),
                        Web3.toChecksumAddress(webhook.escrow_address),
                    )
                except Exception as e:
                    upd = (
                        update(Webhook)
                        .where(Webhook.id == webhook.id)
                        .values(status=WebhookStatuses.failed)
                    )
                    session.execute(upd)
                # TODO: Parse manifest file and start job creation process on CVAT
                job_creation_process(webhook.escrow_address, manifest)
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
