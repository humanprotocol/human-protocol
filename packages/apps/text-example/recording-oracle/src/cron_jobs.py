import json

from human_protocol_sdk.escrow import EscrowClient, EscrowClientError
from urllib3.exceptions import MaxRetryError

from src.chain import sign_message, get_web3
from src.config import Config
from src.db import (
    Session,
    ResultsProcessingRequest,
    stage_success,
    stage_failure,
    Statuses,
)
from src.storage import download_raw_results, upload_data
from src.annotation import calculate_intermediate_results

logger = Config.logging.get_logger()


def process_pending_requests():
    """Downloads raw results and evaluates them. Writes intermediate results to storage."""
    with Session() as session:
        for request in (
            session.query(ResultsProcessingRequest)
            .where(ResultsProcessingRequest.status == Statuses.pending)
            .limit(Config.cron_config.task_chunk_size)
        ):
            try:
                # transform raw results to intermediate results
                results = download_raw_results(request.solution_url)
                intermediate_results = calculate_intermediate_results(results)

                # store results to disk
                Config.storage_config.dataset_dir.mkdir(parents=True, exist_ok=True)
                outpath = Config.storage_config.dataset_dir / f"{request.id}.json"
                with open(outpath, "w") as f:
                    json.dump(intermediate_results, fp=f)

                logger.info(f"Successfully processed results of request {request.id}.")
                stage_success(request)
            except Exception:
                logger.exception(f"Failed to process results of request {request.id}.")
                stage_failure(request)
        session.commit()


def upload_intermediate_results():
    with Session() as session:
        for request in (
            session.query(ResultsProcessingRequest)
            .where(ResultsProcessingRequest.status == Statuses.awaiting_upload)
            .limit(Config.cron_config.task_chunk_size)
        ):
            try:
                # upload files to s3
                path = Config.storage_config.dataset_dir / f"{request.id}.json"
                upload_data(path, content_type="application/json")
                path.unlink()

                # update escrow
                client = EscrowClient(get_web3(request.chain_id))
                client.store_results(
                    request.escrow_address,
                    Config.storage_config.results_s3_url(str(request.id)),
                )

                logger.info(
                    f"Successfully uploaded intermediate results of request {request.id}."
                )
                stage_success(request)
            except EscrowClientError:
                logger.exception("Failed to update escrow.")
                stage_failure(request)
            except Exception:
                logger.exception(
                    f"Failed to upload intermediate results of request {request.id}."
                )
                stage_failure(request)
        session.commit()


def notify_reputation_oracle():
    with Session() as session:
        requests = session.query(ResultsProcessingRequest).where(
            ResultsProcessingRequest.status == Statuses.awaiting_closure
        )
        for request in requests:
            try:
                logger.debug(f"Notifying reputation oracle about job {request.id}.")

                payload = {
                    "escrow_address": request.escrow_address,
                    "chain_id": request.chain_id,
                    "event_type": "task_completed",
                }
                cfg = Config.blockchain_config_from_id(request.chain_id)
                headers = {
                    "Human-Signature": sign_message(
                        payload, get_web3(request.chain_id), cfg.private_key
                    )[0]
                }

                response = Config.http.request(
                    method="POST",
                    url=Config.human.reputation_oracle_url,
                    json=payload,
                    headers=headers,
                )
                if response.status == 200:
                    stage_success(request)
                    logger.info(
                        f"Reputation oracle notified about job {request.id}. Job is complete."
                    )
                else:
                    logger.exception(
                        f"Could not notify reputation oracle about job {request.id}. Response: {response.status}. {response.json()}"
                    )
                    stage_failure(request)
            except MaxRetryError:
                logger.exception(
                    f"Could not notify recording oracle about job {request.id}"
                )
                stage_failure(request)
            except Exception:
                logger.exception(
                    f"Could not notify recording oracle about job {request.id}"
                )
                stage_failure(request)
            session.commit()
