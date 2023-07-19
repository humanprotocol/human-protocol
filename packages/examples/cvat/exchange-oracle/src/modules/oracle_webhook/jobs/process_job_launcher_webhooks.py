import logging

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.cvat.job_flows import job_creation_process, revert_job_creation
from src.modules.chain.escrow import get_escrow_manifest, validate_escrow

from src.modules.oracle_webhook.constants import OracleWebhookTypes
import src.modules.oracle_webhook.service as db_service


LOG_MODULE = "[cron][webhook][process_job_launcher_webhooks]"


def process_job_launcher_webhooks() -> None:
    """
    Process incoming webhooks in a pending state:
      * Creates a job on CVAT
      * Store necessary information about jobs in a database
    """
    try:
        logger = logging.getLogger("app")
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            webhooks = db_service.get_pending_webhooks(
                session,
                OracleWebhookTypes.job_launcher.value,
                CronConfig.process_job_launcher_webhooks_chunk_size,
            )
            for webhook in webhooks:
                try:
                    validate_escrow(webhook.chain_id, webhook.escrow_address)
                    manifest = get_escrow_manifest(
                        webhook.chain_id,
                        webhook.escrow_address,
                    )
                    job_creation_process(
                        webhook.escrow_address, webhook.chain_id, manifest
                    )
                    db_service.handle_webhook_success(session, webhook.id)
                except Exception as e:
                    logger.error(
                        f"Webhook: {webhook.id} failed during execution. Error {e}"
                    )
                    revert_job_creation(webhook.escrow_address)
                    db_service.handle_webhook_fail(session, webhook.id)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
