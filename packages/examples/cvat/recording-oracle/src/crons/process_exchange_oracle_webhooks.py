import logging

from sqlalchemy.orm import Session

import src.services.webhook as oracle_db_service
from src.chain.kvstore import get_exchange_oracle_url
from src.core.config import Config
from src.core.types import ExchangeOracleEventTypes, OracleWebhookTypes
from src.crons._utils import cron_job, handle_webhook, process_outgoing_webhooks
from src.db.utils import ForUpdateParams
from src.handlers.cleanup import clean_escrow
from src.handlers.validation import validate_results
from src.log import ROOT_LOGGER_NAME
from src.models.webhook import Webhook

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


@cron_job(module_logger_name)
def process_incoming_exchange_oracle_webhooks(logger: logging.Logger, session: Session):
    webhooks = oracle_db_service.inbox.get_pending_webhooks(
        session,
        OracleWebhookTypes.exchange_oracle,
        limit=Config.cron_config.process_exchange_oracle_webhooks_chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )

    for webhook in webhooks:
        with handle_webhook(logger, session, webhook):
            handle_exchange_oracle_event(webhook, db_session=session)


def handle_exchange_oracle_event(webhook: Webhook, *, db_session: Session):
    assert webhook.type == OracleWebhookTypes.exchange_oracle

    match webhook.event_type:
        case ExchangeOracleEventTypes.task_finished:
            validate_results(
                escrow_address=webhook.escrow_address,
                chain_id=webhook.chain_id,
                db_session=db_session,
            )
        case ExchangeOracleEventTypes.escrow_cleaned:
            clean_escrow(
                db_session, escrow_address=webhook.escrow_address, chain_id=webhook.chain_id
            )
        case _:
            raise AssertionError(f"Unknown exchange oracle event {webhook.event_type}")


@cron_job(module_logger_name)
def process_outgoing_exchange_oracle_webhooks(logger: logging.Logger, session: Session) -> None:
    process_outgoing_webhooks(
        logger,
        session,
        OracleWebhookTypes.recording_oracle,
        get_exchange_oracle_url,
        Config.cron_config.process_exchange_oracle_webhooks_chunk_size,
    )
