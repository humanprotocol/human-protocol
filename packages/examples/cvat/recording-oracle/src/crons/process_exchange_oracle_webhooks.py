import io
import logging
import os
from typing import Dict

import httpx
from sqlalchemy.orm import Session

import src.chain.escrow as escrow
import src.core.annotation_meta as annotation
import src.core.validation_meta as validation
import src.services.cloud.client as cloud_client
import src.services.webhook as oracle_db_service
from src.chain.kvstore import get_exchange_oracle_url
from src.core.config import Config
from src.core.oracle_events import (
    RecordingOracleEvent_TaskCompleted,
    RecordingOracleEvent_TaskRejected,
)
from src.core.types import ExchangeOracleEventType, OracleWebhookTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.handlers.process_intermediate_results import (
    ValidationSuccess,
    parse_annotation_metafile,
    process_intermediate_results,
    serialize_validation_meta,
)
from src.log import ROOT_LOGGER_NAME
from src.models.webhook import Webhook
from src.services.cloud import download_file
from src.utils.assignments import compute_resulting_annotations_hash, parse_manifest
from src.utils.cloud_storage import parse_bucket_url
from src.utils.logging import get_function_logger
from src.utils.storage import compose_bucket_filename
from src.utils.webhooks import prepare_outgoing_webhook_body, prepare_signed_message

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


def process_incoming_exchange_oracle_webhooks():
    """
    Process incoming oracle webhooks
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.inbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.exchange_oracle,
                limit=Config.cron_config.process_exchange_oracle_webhooks_chunk_size,
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

                    handle_exchange_oracle_event(webhook, db_session=session, logger=logger)

                    oracle_db_service.inbox.handle_webhook_success(session, webhook.id)
                    logger.debug("Webhook handled successfully")
                except Exception as e:
                    logger.exception(f"Webhook {webhook.id} handling failed: {e}")
                    oracle_db_service.inbox.handle_webhook_fail(session, webhook.id)
    except Exception as e:
        logger.exception(e)
    finally:
        logger.debug("Finishing cron job")


def handle_exchange_oracle_event(webhook: Webhook, *, db_session: Session, logger: logging.Logger):
    assert webhook.type == OracleWebhookTypes.exchange_oracle

    match webhook.event_type:
        case ExchangeOracleEventType.task_finished:
            logger.debug(
                f"Received a task finish event for escrow_address={webhook.escrow_address}. "
                "Validating the results"
            )

            escrow.validate_escrow(webhook.chain_id, webhook.escrow_address)

            manifest = parse_manifest(
                escrow.get_escrow_manifest(webhook.chain_id, webhook.escrow_address)
            )

            excor_bucket_host = Config.exchange_oracle_storage_config.provider_endpoint_url()
            excor_bucket_name = Config.exchange_oracle_storage_config.results_bucket_name

            excor_annotation_meta_path = compose_bucket_filename(
                webhook.escrow_address,
                webhook.chain_id,
                annotation.ANNOTATION_METAFILE_NAME,
            )
            annotation_metafile_data = download_file(
                excor_bucket_host, excor_bucket_name, excor_annotation_meta_path
            )
            annotation_meta = parse_annotation_metafile(io.BytesIO(annotation_metafile_data))

            job_annotations: Dict[int, bytes] = {}
            for job_meta in annotation_meta.jobs:
                job_filename = compose_bucket_filename(
                    webhook.escrow_address,
                    webhook.chain_id,
                    job_meta.annotation_filename,
                )
                job_annotations[job_meta.job_id] = download_file(
                    excor_bucket_host, excor_bucket_name, job_filename
                )

            parsed_gt_bucket_url = parse_bucket_url(manifest.validation.gt_url)
            gt_bucket_host = parsed_gt_bucket_url.host_url
            gt_bucket_name = parsed_gt_bucket_url.bucket_name
            gt_filename = parsed_gt_bucket_url.path
            gt_file_data = download_file(
                gt_bucket_host,
                gt_bucket_name,
                gt_filename,
            )

            excor_merged_annotation_path = compose_bucket_filename(
                webhook.escrow_address,
                webhook.chain_id,
                annotation.RESULTING_ANNOTATIONS_FILE,
            )
            merged_annotations = download_file(
                excor_bucket_host, excor_bucket_name, excor_merged_annotation_path
            )

            validation_results = process_intermediate_results(
                db_session,
                escrow_address=webhook.escrow_address,
                chain_id=webhook.chain_id,
                meta=annotation_meta,
                job_annotations={k: io.BytesIO(v) for k, v in job_annotations.items()},
                merged_annotations=io.BytesIO(merged_annotations),
                gt_annotations=io.BytesIO(gt_file_data),
                manifest=manifest,
                logger=logger,
            )

            if isinstance(validation_results, ValidationSuccess):
                logger.info(
                    f"Validation for escrow_address={webhook.escrow_address} successful, "
                    f"average annotation quality is {validation_results.average_quality:.2f}"
                )

                recor_merged_annotations_path = compose_bucket_filename(
                    webhook.escrow_address,
                    webhook.chain_id,
                    validation.RESULTING_ANNOTATIONS_FILE,
                )

                recor_validation_meta_path = compose_bucket_filename(
                    webhook.escrow_address,
                    webhook.chain_id,
                    validation.VALIDATION_METAFILE_NAME,
                )
                validation_metafile = serialize_validation_meta(validation_results.validation_meta)

                storage_client = cloud_client.S3Client(
                    Config.storage_config.provider_endpoint_url(),
                    access_key=Config.storage_config.access_key,
                    secret_key=Config.storage_config.secret_key,
                )

                # TODO: add encryption
                storage_client.create_file(
                    Config.storage_config.results_bucket_name,
                    recor_merged_annotations_path,
                    validation_results.resulting_annotations,
                )
                storage_client.create_file(
                    Config.storage_config.results_bucket_name,
                    recor_validation_meta_path,
                    validation_metafile,
                )

                escrow.store_results(
                    webhook.chain_id,
                    webhook.escrow_address,
                    Config.storage_config.bucket_url()
                    + os.path.dirname(recor_merged_annotations_path),
                    compute_resulting_annotations_hash(validation_results.resulting_annotations),
                )

                oracle_db_service.outbox.create_webhook(
                    db_session,
                    webhook.escrow_address,
                    webhook.chain_id,
                    OracleWebhookTypes.reputation_oracle,
                    event=RecordingOracleEvent_TaskCompleted(),
                )
                oracle_db_service.outbox.create_webhook(
                    db_session,
                    webhook.escrow_address,
                    webhook.chain_id,
                    OracleWebhookTypes.exchange_oracle,
                    event=RecordingOracleEvent_TaskCompleted(),
                )
            else:
                logger.info(
                    f"Validation for escrow_address={webhook.escrow_address} failed, "
                    f"rejected {len(validation_results.rejected_job_ids)} jobs"
                )

                oracle_db_service.outbox.create_webhook(
                    db_session,
                    webhook.escrow_address,
                    webhook.chain_id,
                    OracleWebhookTypes.exchange_oracle,
                    event=RecordingOracleEvent_TaskRejected(
                        rejected_job_ids=validation_results.rejected_job_ids
                    ),
                )

        case _:
            assert False, f"Unknown exchange oracle event {webhook.event_type}"


def process_outgoing_exchange_oracle_webhooks():
    """
    Process webhooks that needs to be sent to exchange oracle:
      * Retrieves `webhook_url` from KVStore
      * Sends webhook to exchange oracle
    """
    logger = get_function_logger(module_logger_name)

    try:
        logger.debug("Starting cron job")

        with SessionLocal.begin() as session:
            webhooks = oracle_db_service.outbox.get_pending_webhooks(
                session,
                OracleWebhookTypes.exchange_oracle,
                limit=Config.cron_config.process_exchange_oracle_webhooks_chunk_size,
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
                        timestamp=webhook.created_at,
                    )

                    _, signature = prepare_signed_message(
                        webhook.escrow_address,
                        webhook.chain_id,
                        body=body,
                    )

                    headers = {"human-signature": signature}
                    webhook_url = get_exchange_oracle_url(webhook.chain_id, webhook.escrow_address)
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
