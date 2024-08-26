import logging

from sqlalchemy.orm import Session

from src.chain.kvstore import get_reputation_oracle_url
from src.core.config import CronConfig
from src.core.types import OracleWebhookTypes
from src.crons._utils import cron_job, process_outgoing_webhooks
from src.log import ROOT_LOGGER_NAME

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


@cron_job(module_logger_name)
def process_outgoing_reputation_oracle_webhooks(logger: logging.Logger, session: Session) -> None:
    process_outgoing_webhooks(
        logger,
        session,
        OracleWebhookTypes.reputation_oracle,
        get_reputation_oracle_url,
        CronConfig.process_reputation_oracle_webhooks_chunk_size,
        with_timestamp=False,
    )
