import io
import os
from logging import Logger

from sqlalchemy.orm import Session

import src.core.annotation_meta as annotation
import src.core.validation_meta as validation
import src.services.webhook as oracle_db_service
from src.chain import escrow
from src.core.config import Config
from src.core.manifest import TaskManifest, parse_manifest
from src.core.oracle_events import (
    RecordingOracleEvent_JobCompleted,
)
from src.core.storage import (
    compose_results_bucket_filename as compose_annotation_results_bucket_filename,
)
from src.core.types import OracleWebhookTypes
from src.core.validation_results import FinalResult
from src.handlers.process_intermediate_results import (
    parse_annotation_metafile,
    process_final_results,
    serialize_validation_meta,
)
from src.log import ROOT_LOGGER_NAME
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.assignments import compute_resulting_annotations_hash
from src.utils.logging import NullLogger, get_function_logger

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


class _TaskUploader:
    def __init__(
        self, escrow_address: str, chain_id: int, manifest: TaskManifest, db_session: Session
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest
        self.db_session = db_session
        self.logger: Logger = NullLogger()

        self.data_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)

        self.annotation_meta: annotation.AnnotationMeta | None = None
        self.merged_annotations: bytes | None = None

    def set_logger(self, logger: Logger):
        self.logger = logger

    def _download_results_meta(self):
        data_bucket_client = make_cloud_client(self.data_bucket)

        annotation_meta_path = compose_annotation_results_bucket_filename(
            self.escrow_address,
            self.chain_id,
            annotation.ANNOTATION_RESULTS_METAFILE_NAME,
        )
        annotation_metafile_data = data_bucket_client.download_file(annotation_meta_path)
        self.annotation_meta = parse_annotation_metafile(io.BytesIO(annotation_metafile_data))

    def _download_annotations(self):
        assert self.annotation_meta is not None

        data_bucket_client = make_cloud_client(self.data_bucket)

        exchange_oracle_merged_annotation_path = compose_annotation_results_bucket_filename(
            self.escrow_address,
            self.chain_id,
            annotation.RESULTING_ANNOTATIONS_FILE,
        )
        merged_annotations = data_bucket_client.download_file(
            exchange_oracle_merged_annotation_path
        )

        self.merged_annotations = merged_annotations

    def _download_results(self):
        self._download_results_meta()
        self._download_annotations()

    def _process_annotation_results(self) -> FinalResult:
        assert self.annotation_meta is not None
        assert self.merged_annotations is not None

        return process_final_results(
            session=self.db_session,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
            meta=self.annotation_meta,
            merged_annotations=io.BytesIO(self.merged_annotations),
            manifest=self.manifest,
            logger=self.logger,
        )

    def upload(self):
        self._download_results()

        validation_result = self._process_annotation_results()

        self._handle_validation_result(validation_result)

    def _compose_validation_results_bucket_filename(self, filename: str) -> str:
        return f"{self.escrow_address}@{self.chain_id}/{filename}"

    _LOW_QUALITY_REASON_MESSAGE_TEMPLATE = (
        "Annotation quality ({}) is below the required threshold ({})"
    )

    def _handle_validation_result(self, export_result: FinalResult):
        logger = self.logger
        escrow_address = self.escrow_address
        chain_id = self.chain_id
        db_session = self.db_session

        logger.info(
            f"Result uploading for escrow_address={escrow_address}: successful, "
            f"average annotation quality is {export_result.average_quality * 100:.2f}%"
        )

        recor_merged_annotations_path = self._compose_validation_results_bucket_filename(
            validation.RESULTING_ANNOTATIONS_FILE,
        )

        recor_validation_meta_path = self._compose_validation_results_bucket_filename(
            validation.VALIDATION_METAFILE_NAME,
        )
        validation_metafile = serialize_validation_meta(export_result.validation_meta)

        storage_client = make_cloud_client(BucketAccessInfo.parse_obj(Config.storage_config))

        # TODO: add encryption
        storage_client.create_file(
            recor_merged_annotations_path,
            export_result.resulting_annotations,
        )
        storage_client.create_file(
            recor_validation_meta_path,
            validation_metafile,
        )

        escrow.store_results(
            chain_id,
            escrow_address,
            Config.storage_config.bucket_url() + os.path.dirname(recor_merged_annotations_path),  # noqa: PTH120
            compute_resulting_annotations_hash(export_result.resulting_annotations),
        )

        oracle_db_service.outbox.create_webhook(
            db_session,
            escrow_address,
            chain_id,
            OracleWebhookTypes.reputation_oracle,
            event=RecordingOracleEvent_JobCompleted(),
        )


def export_results(
    escrow_address: str,
    chain_id: int,
    db_session: Session,
):
    logger = get_function_logger(module_logger_name)

    manifest = parse_manifest(escrow.get_escrow_manifest(chain_id, escrow_address))

    uploader = _TaskUploader(
        escrow_address=escrow_address, chain_id=chain_id, manifest=manifest, db_session=db_session
    )
    uploader.set_logger(logger)
    uploader.upload()
