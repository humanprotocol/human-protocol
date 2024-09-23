import logging

from datumaro.util import take_by
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
    RecordingOracleEventTypes,
    TaskStatuses,
)
from src.crons._cron_job import cron_job
from src.crons.webhooks._common import handle_webhook, process_outgoing_webhooks
from src.db.utils import ForUpdateParams
from src.models.webhook import Webhook


@cron_job
def process_incoming_recording_oracle_webhooks(logger: logging.Logger, session: Session):
    """
    Process incoming oracle webhooks
    """
    webhooks = oracle_db_service.inbox.get_pending_webhooks(
        session,
        OracleWebhookTypes.recording_oracle,
        limit=CronConfig.process_recording_oracle_webhooks_chunk_size,
        for_update=ForUpdateParams(skip_locked=True),
    )

    for webhook in webhooks:
        with handle_webhook(logger, session, webhook):
            handle_recording_oracle_event(webhook, db_session=session, logger=logger)


def handle_recording_oracle_event(webhook: Webhook, *, db_session: Session, logger: logging.Logger):
    assert webhook.type == OracleWebhookTypes.recording_oracle

    match webhook.event_type:
        case RecordingOracleEventTypes.task_completed:
            chunk_size = CronConfig.accepted_projects_chunk_size
            project_ids = cvat_db_service.get_project_cvat_ids_by_escrow_address(
                db_session, webhook.escrow_address
            )
            if not project_ids:
                logger.error(
                    f"Unexpected event {webhook.event_type} received for an unknown project, "
                    f"ignoring (escrow_address={webhook.escrow_address})"
                )
                return

            for ids_chunk in take_by(project_ids, chunk_size):
                projects_chunk = cvat_db_service.get_projects_by_cvat_ids(
                    db_session, ids_chunk, for_update=True, limit=chunk_size
                )

                for project in projects_chunk:
                    if project.status != ProjectStatuses.validation:
                        logger.error(
                            "Unexpected event {} received for a project in the {} status, "
                            "ignoring (escrow_address={}, project={})".format(
                                webhook.event_type,
                                project.status,
                                webhook.escrow_address,
                                project.cvat_id,
                            )
                        )
                        return

                    new_status = ProjectStatuses.recorded
                    logger.info(
                        "Changing project status to {} (escrow_address={}, project={})".format(
                            new_status, webhook.escrow_address, project.cvat_id
                        )
                    )
                    cvat_db_service.update_project_status(db_session, project.id, new_status)

        case RecordingOracleEventTypes.task_rejected:
            event = RecordingOracleEvent_TaskRejected.parse_obj(webhook.event_data)

            rejected_jobs = cvat_db_service.get_jobs_by_cvat_id(db_session, event.rejected_job_ids)
            rejected_project_cvat_ids = set(j.cvat_project_id for j in rejected_jobs)

            chunk_size = CronConfig.rejected_projects_chunk_size
            for chunk_ids in take_by(rejected_project_cvat_ids, chunk_size):
                projects_chunk = cvat_db_service.get_projects_by_cvat_ids(
                    db_session, chunk_ids, for_update=True, limit=chunk_size
                )

                for project in projects_chunk:
                    if project.status != ProjectStatuses.validation:
                        logger.error(
                            "Unexpected event {} received for a project in the {} status, "
                            "ignoring (escrow_address={}, project_id={})".format(
                                webhook.event_type,
                                project.status,
                                webhook.escrow_address,
                                project.cvat_id,
                            )
                        )
                        continue

                    rejected_jobs_in_project = [
                        j for j in rejected_jobs if j.cvat_project_id == project.cvat_id
                    ]
                    tasks_to_update = set()
                    for job in rejected_jobs_in_project:
                        tasks_to_update.add(job.task.id)
                        cvat_db_service.update_job_status(db_session, job.id, JobStatuses.new)

                    for task_id in tasks_to_update:
                        cvat_db_service.update_task_status(
                            db_session, task_id, TaskStatuses.annotation
                        )

                    new_status = ProjectStatuses.annotation
                    logger.info(
                        "Changing project status to {} (escrow_address={}, project={})".format(
                            new_status, webhook.escrow_address, project.cvat_id
                        )
                    )
                    cvat_db_service.update_project_status(db_session, project.id, new_status)

        case _:
            raise AssertionError(f"Unknown recording oracle event {webhook.event_type}")


@cron_job
def process_outgoing_recording_oracle_webhooks(logger: logging.Logger, session: Session):
    process_outgoing_webhooks(
        logger,
        session,
        OracleWebhookTypes.recording_oracle,
        get_recording_oracle_url,
        CronConfig.process_recording_oracle_webhooks_chunk_size,
    )
