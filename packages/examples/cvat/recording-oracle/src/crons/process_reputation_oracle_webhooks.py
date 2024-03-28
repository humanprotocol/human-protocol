import httpx

import src.services.webhook as oracle_db_service
from src.chain.kvstore import get_reputation_oracle_url
from src.core.config import CronConfig
from src.core.types import OracleWebhookTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.log import ROOT_LOGGER_NAME
from src.utils.logging import get_function_logger
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


def process_outgoing_reputation_oracle_webhooks():
    """
    Process webhooks that needs to be sent to reputation oracle:
      * Retrieves `webhook_url` from KVStore
      * Sends webhook to reputation oracle
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.outbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.reputation_oracle,
                limit=CronConfig.process_reputation_oracle_webhooks_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )
            for webhook in webhooks:
                try:
                    logger.debug(
                        "Processing webhook "
                        f"{webhook.type}.{webhook.event_type} "
                        f"in escrow_address={webhook.escrow_address} "
                        f"(attempt {webhook.attempts + 1})"
                    )

                    body = prepare_outgoing_webhook_body(
                        webhook.escrow_address,
                        webhook.chain_id,
                        webhook.event_type,
                        webhook.event_data,
                        timestamp=None,  # TODO: reputation oracle doesn't support
                    )

                    _, signature = prepare_signed_message(
                        webhook.escrow_address,
                        webhook.chain_id,
                        body=body,
                    )

                    headers = {"human-signature": signature}
                    webhook_url = get_reputation_oracle_url(
                        webhook.chain_id, webhook.escrow_address
                    )
                    with httpx.Client() as client:
                        response = client.post(webhook_url, headers=headers, json=body)
                        response.raise_for_status()

                    oracle_db_service.outbox.handle_webhook_success(session, webhook.id)
                    logger.debug("Webhook handled successfully")
                except Exception as e:
                    logger.exception(f"Webhook {webhook.id} sending failed: {e}")
                    oracle_db_service.outbox.handle_webhook_fail(session, webhook.id)
    except Exception as e:
        logger.exception(e)
    finally:
        logger.debug("Finishing cron job")
