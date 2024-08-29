import logging

from human_protocol_sdk.constants import Status as EscrowStatus
from sqlalchemy.orm import Session

import src.handlers.job_creation as cvat
import src.services.cvat as cvat_db_service
import src.services.webhook as oracle_db_service
from src.chain.escrow import validate_escrow
from src.chain.kvstore import get_job_launcher_url
from src.core.config import Config, CronConfig
from src.core.oracle_events import (
    ExchangeOracleEvent_EscrowCleaned,
    ExchangeOracleEvent_TaskCreationFailed,
)
from src.core.types import JobLauncherEventTypes, Networks, OracleWebhookTypes, ProjectStatuses
from src.crons._cron_job import cron_job
from src.crons.webhooks._common import handle_webhook, process_outgoing_webhooks
from src.db.utils import ForUpdateParams
from src.handlers.escrow_cleanup import cleanup_escrow
from src.models.webhook import Webhook


def handle_failure(session: Session, webhook: Webhook, exc: Exception) -> None:
    if (
        webhook.event_type == JobLauncherEventTypes.escrow_created
        and webhook.attempts + 1 >= Config.webhook_max_retries
    ):
        logging.error(
            f"Exceeded maximum retries for {webhook.escrow_address=} creation. "
            f"Notifying job launcher."
        )
        # TODO: think about unifying this further
        oracle_db_service.outbox.create_webhook(
            session=session,
            escrow_address=webhook.escrow_address,
            chain_id=webhook.chain_id,
            type=OracleWebhookTypes.job_launcher,
            event=ExchangeOracleEvent_TaskCreationFailed(reason=str(exc)),
        )


@cron_job
def process_incoming_job_launcher_webhooks(logger: logging.Logger, session: Session):
    """
    Process incoming job launcher webhooks
    """
    webhooks = oracle_db_service.inbox.get_pending_webhooks(
        session,
        OracleWebhookTypes.job_launcher,
        limit=CronConfig.process_job_launcher_webhooks_chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )

    for webhook in webhooks:
        with handle_webhook(logger, session, webhook, on_fail=handle_failure):
            handle_job_launcher_event(webhook, db_session=session, logger=logger)


def handle_job_launcher_event(webhook: Webhook, *, db_session: Session, logger: logging.Logger):
    assert webhook.type == OracleWebhookTypes.job_launcher

    match webhook.event_type:
        case JobLauncherEventTypes.escrow_created:
            try:
                validate_escrow(
                    webhook.chain_id,
                    webhook.escrow_address,
                    allow_no_funds=True,
                )

                if cvat_db_service.get_project_by_escrow_address(
                    db_session, webhook.escrow_address, for_update=True
                ):
                    logger.error(
                        f"Received an escrow creation event for "
                        f"escrow_address {webhook.escrow_address}. "
                        "A CVAT project for this escrow already exists, ignoring the event."
                    )
                    return

                logger.info(
                    f"Creating a new CVAT project (escrow_address={webhook.escrow_address})"
                )

                cvat.create_task(webhook.escrow_address, webhook.chain_id)

            except Exception:
                projects = cvat_db_service.get_projects_by_escrow_address(
                    db_session, webhook.escrow_address
                )

                cleanup_escrow(webhook.escrow_address, Networks(webhook.chain_id), projects)
                cvat_db_service.delete_projects(
                    db_session, webhook.escrow_address, webhook.chain_id
                )
                raise

        case JobLauncherEventTypes.escrow_canceled:
            validate_escrow(
                webhook.chain_id,
                webhook.escrow_address,
                accepted_states=[EscrowStatus.Pending, EscrowStatus.Cancelled],
            )

            projects = cvat_db_service.get_projects_by_escrow_address(
                db_session, webhook.escrow_address, for_update=True, limit=None
            )
            if not projects:
                logger.error(
                    "Received escrow cancel event "
                    f"(escrow_address={webhook.escrow_address}). "
                    "The project doesn't exist, ignoring"
                )
                return

            for project in projects:
                if project.status in [
                    ProjectStatuses.canceled,
                    ProjectStatuses.recorded,
                ]:
                    logger.error(
                        "Received escrow cancel event "
                        f"(escrow_address={webhook.escrow_address}). "
                        "The project is already finished, ignoring"
                    )
                    continue

                logger.info(
                    f"Received escrow cancel event (escrow_address={webhook.escrow_address}). "
                    "Canceling the project"
                )

            cvat_db_service.finish_escrow_creations_by_escrow_address(
                db_session, escrow_address=webhook.escrow_address, chain_id=webhook.chain_id
            )
            cvat_db_service.update_project_statuses_by_escrow_address(
                db_session, webhook.escrow_address, webhook.chain_id, ProjectStatuses.canceled
            )
            cleanup_escrow(webhook.escrow_address, Networks(webhook.chain_id), projects)

            oracle_db_service.outbox.create_webhook(
                session=db_session,
                escrow_address=webhook.escrow_address,
                chain_id=webhook.chain_id,
                type=OracleWebhookTypes.recording_oracle,
                event=ExchangeOracleEvent_EscrowCleaned(),
            )
        case _:
            raise AssertionError(f"Unknown job launcher event {webhook.event_type}")


@cron_job
def process_outgoing_job_launcher_webhooks(logger: logging.Logger, session: Session):
    process_outgoing_webhooks(
        logger,
        session,
        OracleWebhookTypes.job_launcher,
        get_job_launcher_url,
        CronConfig.process_job_launcher_webhooks_chunk_size,
    )
