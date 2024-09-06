import logging

from sqlalchemy.orm import Session

import src.services.cvat as db_service
import src.services.webhook as oracle_db_service
from src.chain.kvstore import get_reputation_oracle_url
from src.core.config import CronConfig
from src.core.oracle_events import (
    ExchangeOracleEvent_EscrowCleaned,
)
from src.core.types import (
    Networks,
    OracleWebhookTypes,
    ProjectStatuses,
    ReputationOracleEventTypes,
)
from src.crons._cron_job import cron_job
from src.crons.webhooks._common import handle_webhook, process_outgoing_webhooks
from src.db.utils import ForUpdateParams
from src.handlers.escrow_cleanup import cleanup_escrow


@cron_job
def process_incoming_reputation_oracle_webhooks(logger: logging.Logger, session: Session):
    webhooks = oracle_db_service.inbox.get_pending_webhooks(
        session,
        OracleWebhookTypes.reputation_oracle,
        limit=CronConfig.process_reputation_oracle_webhooks_chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )
    for webhook in webhooks:
        with handle_webhook(logger, session, webhook):
            match webhook.event_type:
                case ReputationOracleEventTypes.escrow_completed:
                    projects = db_service.get_projects_by_escrow_address(
                        session, webhook.escrow_address
                    )
                    cleanup_escrow(webhook.escrow_address, Networks(webhook.chain_id), projects)

                    db_service.update_project_statuses_by_escrow_address(
                        session,
                        webhook.escrow_address,
                        webhook.chain_id,
                        status=ProjectStatuses.deleted,
                    )

                    oracle_db_service.outbox.create_webhook(
                        session=session,
                        escrow_address=webhook.escrow_address,
                        chain_id=webhook.chain_id,
                        type=OracleWebhookTypes.recording_oracle,
                        event=ExchangeOracleEvent_EscrowCleaned(),
                    )
                case _:
                    raise TypeError(f"Unknown reputation oracle event {webhook.event_type}")


@cron_job
def process_outgoing_reputation_oracle_webhooks(logger: logging.Logger, session: Session):
    process_outgoing_webhooks(
        logger,
        session,
        OracleWebhookTypes.recording_oracle,
        get_reputation_oracle_url,
        CronConfig.process_recording_oracle_webhooks_chunk_size,
    )
