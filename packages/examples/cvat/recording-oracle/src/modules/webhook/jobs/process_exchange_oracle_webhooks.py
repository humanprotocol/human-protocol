import logging

from human_protocol_sdk.storage import StorageClient, Credentials

from src.database import SessionLocal
from src.config import CronConfig, StorageConfig

from src.modules.webhook.process_intermediate_results import (
    process_intermediate_results,
)

from src.modules.webhook.constants import OracleWebhookTypes
from src.modules.webhook.helpers import prepare_signature, get_intermediate_results

import src.modules.webhook.service as db_service
import src.modules.chain.escrow as escrow


LOG_MODULE = "[cron][webhook][process_exchange_oracle_webhooks]"


def process_exchange_oracle_webhooks() -> None:
    """
    Process exchange oracle webhooks in a pending state:
      * Retrieves raw results from s3 bucket
      * Evaluates them and store final annotations in s3 bucket
      * Prepares a webhook for reputation oracle
    """
    try:
        logger = logging.getLogger("app")
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            webhooks = db_service.get_pending_webhooks(
                session,
                OracleWebhookTypes.exchange_oracle.value,
                CronConfig.process_exchange_oracle_webhooks_chunk_size,
            )
            for webhook in webhooks:
                try:
                    escrow.validate_escrow(webhook.chain_id, webhook.escrow_address)
                    job_type = escrow.get_escrow_job_type(
                        webhook.chain_id, webhook.escrow_address
                    )

                    intermediate_results = get_intermediate_results(webhook.s3_url)
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

                    escrow.store_results(
                        webhook.chain_id,
                        webhook.escrow_address,
                        f"{StorageConfig.bucket_url()}{files[0]['key']}",
                        files[0],
                    )

                    db_service.create_webhook(
                        session,
                        webhook.escrow_address,
                        webhook.chain_id,
                        webhook.s3_url,
                        OracleWebhookTypes.reputation_oracle.value,
                        prepare_signature(webhook.escrow_address, webhook.chain_id),
                    )

                    db_service.handle_webhook_success(session, webhook.id)
                except Exception as e:
                    logger.error(
                        f"Webhook: {webhook.id} failed during execution. Error {e}"
                    )
                    db_service.handle_webhook_fail(session, webhook.id)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
