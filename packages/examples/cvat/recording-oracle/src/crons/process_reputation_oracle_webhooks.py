import httpx
import logging

from src.db import SessionLocal
from src.core.config import CronConfig

from src.chain.escrow import get_reputation_oracle_address
from src.chain.kvstore import get_reputation_oracle_url

from src.core.constants import OracleWebhookTypes
from src.utils.helpers import prepare_reputation_oracle_webhook_body

import src.services.webhook as db_service


LOG_MODULE = "[cron][webhook][process_reputation_oracle_webhooks]"


def process_reputation_oracle_webhooks() -> None:
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
                OracleWebhookTypes.reputation_oracle.value,
                CronConfig.process_reputation_oracle_webhooks_chunk_size,
            )
            for webhook in webhooks:
                try:
                    reputation_oracle_address = get_reputation_oracle_address(
                        webhook.chain_id, webhook.escrow_address
                    )
                    webhook_url = get_reputation_oracle_url(
                        webhook.chain_id, reputation_oracle_address
                    )

                    headers = {"human-signature": webhook.signature}
                    body = prepare_reputation_oracle_webhook_body(
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
