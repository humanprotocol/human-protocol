import json

from src.config import Config
from src.db import (
    Session,
    ResultsProcessingRequest,
    stage_success,
    stage_failure,
    Statuses,
)
from src.storage import download_raw_results, upload_data

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
                results = download_raw_results(request.solution_url)

                process_raw_results(results, request.id)

                logger.info(f"Successfully processed results of request {request.id}.")
                stage_success(request)
            except Exception:
                logger.exception(f"Failed to process results of request {request.id}.")
                stage_failure(request)
        session.commit()


def process_raw_results(results, id):
    # TODO: replace with actual implementation
    Config.storage_config.dataset_dir.mkdir(parents=True, exist_ok=True)
    outpath = Config.storage_config.dataset_dir / f"{id}.json"
    with open(outpath, "w") as f:
        json.dump({"annotations": results}, fp=f)
    return outpath


def upload_intermediate_results():
    with Session() as session:
        for request in (
            session.query(ResultsProcessingRequest)
            .where(ResultsProcessingRequest.status == Statuses.awaiting_upload)
            .limit(Config.cron_config.task_chunk_size)
        ):
            try:
                path = Config.storage_config.dataset_dir / f"{request.id}.json"
                upload_data(path, content_type="application/json")
                path.unlink()

                logger.info(
                    f"Successfully uploaded intermediate results of request {request.id}."
                )
                stage_success(request)
            except Exception:
                logger.exception(
                    f"Failed to upload intermediate results of request {request.id}."
                )
                stage_failure(request)
        session.commit()
