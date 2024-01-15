import json

from human_protocol_sdk.escrow import EscrowClient, EscrowClientError
from urllib3.exceptions import MaxRetryError

from src.chain import sign_message, get_web3, EscrowInfo, get_manifest_url
from src.config import Config
from src.db import (
    Session,
    ResultsProcessingRequest,
    stage_success,
    stage_failure,
    Statuses,
)
from src.storage import (
    download_raw_results,
    upload_data,
    hash_file_content,
    download_manifest,
    download_ground_truth,
)
from src.annotation import calculate_intermediate_results

logger = Config.logging.get_logger()


def process_pending_requests():
    """Downloads raw results and evaluates them. Writes intermediate results to storage."""
    logger.info("Processing pending requests.")
    with Session() as session:
        for request in (
            session.query(ResultsProcessingRequest)
            .where(ResultsProcessingRequest.status == Statuses.pending)
            .limit(Config.cron_config.task_chunk_size)
        ):
            logger.info(f"Processing request {request.id}.")
            try:
                logger.info(f"Downloading required resources to process {request.id}.")
                raw_results = download_raw_results(request.solution_url)
                manifest = download_manifest(
                    get_manifest_url(
                        EscrowInfo(
                            chain_id=request.chain_id,
                            escrow_address=request.escrow_address,
                        )
                    )
                )
                uri = manifest.groundtruth_uri
                if uri is None:
                    ground_truth = None
                else:
                    ground_truth = download_ground_truth(manifest.groundtruth_uri)

                logger.info(f"Calculating intermediate results for {request.id}.")
                intermediate_results = calculate_intermediate_results(
                    raw_results, ground_truth
                )

                logger.info(f"Storing intermediate results for {request.id}.")
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
    logger.info("Uploading intermediate results.")
    with Session() as session:
        for request in (
            session.query(ResultsProcessingRequest)
            .where(ResultsProcessingRequest.status == Statuses.awaiting_upload)
            .limit(Config.cron_config.task_chunk_size)
        ):
            try:
                # upload files to s3
                logger.info(f"Uploading intermediate results of {request.id}.")
                path = Config.storage_config.dataset_dir / f"{request.id}.json"
                content_hash = hash_file_content(path)
                upload_data(path, content_type="application/json")

                # update escrow
                logger.info(f"Updating escrow of {request.id}.")
                EscrowClient(get_web3(request.chain_id)).store_results(
                    request.escrow_address,
                    Config.storage_config.results_s3_url(str(request.id)),
                    content_hash,
                )

                logger.info(f"Cleaning up storage for {request.id}.")
                path.unlink()

                stage_success(request)
                logger.info(
                    f"Successfully uploaded intermediate results of request {request.id}."
                )
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
    logger.info("Notifying reputation oracle.")
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
