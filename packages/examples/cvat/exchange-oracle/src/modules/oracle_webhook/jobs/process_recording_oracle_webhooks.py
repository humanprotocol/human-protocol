import httpx
import logging

from src.db import SessionLocal
from src.config import CronConfig

from src.modules.chain.kvstore import get_recording_oracle_url

from src.modules.oracle_webhook.constants import OracleWebhookTypes
from src.modules.oracle_webhook.helpers import prepare_recording_oracle_webhook_body

import src.modules.oracle_webhook.service as db_service


LOG_MODULE = "[cron][webhook][process_recording_oracle_webhooks]"


def process_recording_oracle_webhooks() -> None:
    """
    Process webhooks that needs to be sent to recording oracle:
      * Retrieves `webhook_url` from KVStore
      * Sends webhook to recording oracle
    """
    try:
        logger = logging.getLogger("app")
        logger.info(f"{LOG_MODULE} Starting cron job")
        with SessionLocal.begin() as session:
            webhooks = db_service.get_pending_webhooks(
                session,
                OracleWebhookTypes.recording_oracle.value,
                CronConfig.process_recording_oracle_webhooks_chunk_size,
            )
            for webhook in webhooks:
                try:
                    webhook_url = get_recording_oracle_url(
                        webhook.chain_id, webhook.escrow_address
                    )
                    headers = {"human-signature": webhook.signature}
                    body = prepare_recording_oracle_webhook_body(
                        webhook.escrow_address, webhook.chain_id
                    )
                    with httpx.Client() as client:
                        response = client.post(webhook_url, headers=headers, json=body)
                        response.raise_for_status()
                    db_service.handle_webhook_success(session, webhook.id)
                except Exception as e:
                    logger.error(
                        f"{LOG_MODULE} Webhook: {webhook.id} failed during execution. Error {e}"
                    )
                    db_service.handle_webhook_fail(session, webhook.id)

        logger.info(f"{LOG_MODULE} Finishing cron job")
        return None
    except Exception as e:
        logger.error(e)
