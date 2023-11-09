import logging

import httpx
from sqlalchemy.orm import Session

import src.services.cvat as cvat_db_service
import src.services.webhook as oracle_db_service
from src.chain.kvstore import get_recording_oracle_url
from src.core.config import CronConfig
from src.core.oracle_events import RecordingOracleEvent_TaskRejected
from src.core.types import (
    JobStatuses,
    OracleWebhookTypes,
    ProjectStatuses,
    RecordingOracleEventType,
    TaskStatus,
)
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.log import ROOT_LOGGER_NAME
from src.models.webhook import Webhook
from src.utils.logging import get_function_logger
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


def process_incoming_recording_oracle_webhooks():
    """
    Process incoming oracle webhooks
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.inbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.recording_oracle,
                limit=CronConfig.process_recording_oracle_webhooks_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )

            for webhook in webhooks:
                try:
                    handle_recording_oracle_event(webhook, db_session=session, logger=logger)

                    oracle_db_service.inbox.handle_webhook_success(session, webhook.id)
                except Exception as e:
                    logger.exception(f"Webhook {webhook.id} handling failed: {e}")
                    oracle_db_service.inbox.handle_webhook_fail(session, webhook.id)
    except Exception as e:
        logger.exception(e)
    finally:
        logger.debug("Finishing cron job")


def handle_recording_oracle_event(webhook: Webhook, *, db_session: Session, logger: logging.Logger):
    assert webhook.type == OracleWebhookTypes.recording_oracle

    match webhook.event_type:
        case RecordingOracleEventType.task_completed:
            project = cvat_db_service.get_project_by_escrow_address(
                db_session, webhook.escrow_address, for_update=True
            )
            if not project:
                logger.error(
                    "Unexpected event {} received for an unknown project, "
                    "ignoring (escrow_address={})".format(
                        webhook.event_type, webhook.escrow_address
                    )
                )
                return

            if project.status != ProjectStatuses.validation:
                logger.error(
                    "Unexpected event {} received for a project in the {} status, "
                    "ignoring (escrow_address={})".format(
                        webhook.event_type, project.status, webhook.escrow_address
                    )
                )
                return

            new_status = ProjectStatuses.recorded
            logger.info(
                "Changing project status to {} (escrow_address={})".format(
                    new_status, webhook.escrow_address
                )
            )

            cvat_db_service.update_project_status(db_session, project.id, new_status)

        case RecordingOracleEventType.task_rejected:
            event = RecordingOracleEvent_TaskRejected.parse_obj(webhook.event_data)

            project = cvat_db_service.get_project_by_escrow_address(
                db_session, webhook.escrow_address, for_update=True
            )

            if project.status != ProjectStatuses.validation:
                logger.error(
                    "Unexpected event {} received for a project in the {} status, "
                    "ignoring (escrow_address={})".format(
                        webhook.event_type, project.status, webhook.escrow_address
                    )
                )
                return

            rejected_jobs = cvat_db_service.get_jobs_by_cvat_id(db_session, event.rejected_job_ids)

            tasks_to_update = set()

            for job in rejected_jobs:
                tasks_to_update.add(job.task.id)
                cvat_db_service.update_job_status(db_session, job.id, JobStatuses.new)

            for task_id in tasks_to_update:
                cvat_db_service.update_task_status(db_session, task_id, TaskStatus.annotation)

            cvat_db_service.update_project_status(
                db_session, project.id, ProjectStatuses.annotation
            )

        case _:
            assert False, f"Unknown recording oracle event {webhook.event_type}"


def process_outgoing_recording_oracle_webhooks():
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
                OracleWebhookTypes.recording_oracle,
                limit=CronConfig.process_recording_oracle_webhooks_chunk_size,
                for_update=ForUpdateParams(skip_locked=True),
            )
            for webhook in webhooks:
                try:
                    logger.debug(
                        "Processing webhook "
                        f"{webhook.type}.{webhook.event_type} "
                        f"(attempt {webhook.attempts + 1})"
                    )

                    body = prepare_outgoing_webhook_body(
                        webhook.escrow_address,
                        webhook.chain_id,
                        webhook.event_type,
                        webhook.event_data,
                        timestamp=webhook.created_at,
                    )

                    _, signature = prepare_signed_message(
                        webhook.escrow_address,
                        webhook.chain_id,
                        body=body,
                    )

                    headers = {"human-signature": signature}
                    webhook_url = get_recording_oracle_url(webhook.chain_id, webhook.escrow_address)
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
