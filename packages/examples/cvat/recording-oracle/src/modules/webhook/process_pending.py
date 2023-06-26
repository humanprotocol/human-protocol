import logging
from sqlalchemy import update

from src.db import SessionLocal
from src.config import CronConfig, StorageConfig

from src.modules.chain.escrow import (
    validate_escrow,
    get_escrow_job_type,
    get_intermediate_results,
)
from human_protocol_sdk.storage import StorageClient, Credentials
from src.modules.webhook.process_intermediate_results import (
    process_intermediate_results,
)

from .model import Webhook, WebhookStatuses
from .service import get_pending_webhooks


LOG_MODULE = "[cron][webhook][process_incoming]"


def process_incoming_webhooks() -> None:
    """
    Process incoming webhooks in a pending state:
      * Retrieves raw results from s3 bucket
      * Evaluates them and store final annotations in s3 bucket
      * Sends a webhook to Reputation Oracle
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
                    job_type = get_escrow_job_type(
                        webhook.chain_id, webhook.escrow_address
                    )

                    intermediate_results = get_intermediate_results(
                        webhook.chain_id, webhook.escrow_address
                    )
                    final_results = process_intermediate_results(
                        intermediate_results, job_type
                    )

                    storage_client = StorageClient(
                        StorageConfig.endpoint_url,
                        StorageConfig.region,
                        Credentials(
                            StorageConfig.access_key,
                            StorageConfig.secret_key,
                        ),
                    )
                    files = storage_client.upload_files(
                        [final_results], StorageConfig.results_bucket_name
                    )
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
