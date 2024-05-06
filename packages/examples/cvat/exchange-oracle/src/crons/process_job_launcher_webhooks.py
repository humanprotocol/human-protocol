import logging

import httpx
from human_protocol_sdk.constants import Status as EscrowStatus
from sqlalchemy.orm import Session

import src.handlers.job_creation as cvat
import src.services.cvat as cvat_db_service
import src.services.webhook as oracle_db_service
from src.chain.escrow import validate_escrow
from src.chain.kvstore import get_job_launcher_url
from src.core.config import Config, CronConfig
from src.core.oracle_events import ExchangeOracleEvent_TaskCreationFailed
from src.core.types import JobLauncherEventTypes, OracleWebhookTypes, ProjectStatuses
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.log import ROOT_LOGGER_NAME
from src.models.webhook import Webhook
from src.utils.logging import get_function_logger
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


def process_incoming_job_launcher_webhooks():
    """
    Process incoming job launcher webhooks
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.inbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.job_launcher,
                limit=CronConfig.process_job_launcher_webhooks_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for webhook in webhooks:
                try:
                    logger.debug(
                        "Processing webhook "
                        f"{webhook.type}.{webhook.event_type}~{webhook.signature} "
                        f"in escrow_address={webhook.escrow_address} "
                        f"(attempt {webhook.attempts + 1})"
                    )

                    handle_job_launcher_event(webhook, db_session=session, logger=logger)

                    oracle_db_service.inbox.handle_webhook_success(session, webhook.id)

                    logger.debug("Webhook handled successfully")
                except Exception as e:
                    logger.exception(f"Webhook {webhook.id} handling failed: {e}")
                    oracle_db_service.inbox.handle_webhook_fail(session, webhook.id)
    except Exception as e:
        logger.exception(e)
    finally:
        logger.debug("Finishing cron job")


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

            except Exception as ex:
                try:
                    cvat.remove_task(webhook.escrow_address)
                except Exception as ex_remove:
                    logger.exception(ex_remove)

                if webhook.attempts + 1 >= Config.webhook_max_retries:
                    # We should not notify before the webhook handling attempts have expired
                    oracle_db_service.outbox.create_webhook(
                        session=db_session,
                        escrow_address=webhook.escrow_address,
                        chain_id=webhook.chain_id,
                        type=OracleWebhookTypes.job_launcher,
                        event=ExchangeOracleEvent_TaskCreationFailed(reason=str(ex)),
                    )

                raise

        case JobLauncherEventTypes.escrow_canceled:
            try:
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
                    cvat_db_service.update_project_status(
                        db_session, project.id, ProjectStatuses.canceled
                    )

                cvat_db_service.finish_escrow_creations_by_escrow_address(
                    db_session, escrow_address=webhook.escrow_address, chain_id=webhook.chain_id
                )

            except Exception as ex:
                raise

        case _:
            assert False, f"Unknown job launcher event {webhook.event_type}"


def process_outgoing_job_launcher_webhooks():
    """
    Process webhooks that needs to be sent to recording oracle:
      * Retrieves `webhook_url` from KVStore
      * Sends webhook to recording oracle
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.outbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.job_launcher,
                limit=CronConfig.process_job_launcher_webhooks_chunk_size,
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
                        timestamp=None,  # TODO: launcher doesn't support it yet
                    )

                    _, signature = prepare_signed_message(
                        webhook.escrow_address,
                        webhook.chain_id,
                        body=body,
                    )

                    headers = {"human-signature": signature}
                    webhook_url = get_job_launcher_url(webhook.chain_id, webhook.escrow_address)
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
