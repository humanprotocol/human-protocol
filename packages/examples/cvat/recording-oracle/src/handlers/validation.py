import csv
import io
import json
import os
import zipfile
from collections import Counter
from logging import Logger
from pathlib import Path
from tempfile import TemporaryDirectory

from sqlalchemy.orm import Session

import src.core.annotation_meta as annotation
import src.core.validation_meta as validation
import src.services.webhook as oracle_db_service
from src.chain import escrow
from src.core.config import Config
from src.core.manifest import TaskManifest, parse_manifest
from src.core.oracle_events import (
    RecordingOracleEvent_JobCompleted,
    RecordingOracleEvent_SubmissionRejected,
)
from src.core.storage import (
    compose_results_bucket_filename as compose_annotation_results_bucket_filename,
)
from src.core.types import OracleWebhookTypes, TaskTypes
from src.core.validation_errors import TooFewGtError
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.handlers.process_intermediate_results import (
    parse_annotation_metafile,
    process_intermediate_results,
    serialize_validation_meta,
)
from src.log import ROOT_LOGGER_NAME
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.assignments import compute_resulting_annotations_hash
from src.utils.logging import NullLogger, get_function_logger
from src.utils.zip_archive import write_dir_to_zip_archive

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


class _TaskValidator:
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

        def convert_value(value: str):
            """Converts a string value to int, float, or keeps it as string."""
            try:
                f = float(value)
                if f.is_integer():
                    return int(f)
                return f
            except ValueError:
                return value

        if self.manifest.annotation.type == TaskTypes.audio_transcription:
            annotations = []

            with TemporaryDirectory() as tempdir:
                temp_path = Path(tempdir)

                merged_annotations_path = temp_path / "merged_annotations"
                merged_annotations_path.mkdir(parents=True, exist_ok=True)

                clips_path = merged_annotations_path / "clips"
                clips_path.mkdir(parents=True, exist_ok=True)

                annotations_file = merged_annotations_path / "annotations.json"

                for job_meta in self.annotation_meta.jobs:
                    job_filename = compose_annotation_results_bucket_filename(
                        self.escrow_address,
                        self.chain_id,
                        job_meta.annotation_filename,
                    )
                    downloaded_annotations = data_bucket_client.download_file(job_filename)

                    with zipfile.ZipFile(io.BytesIO(downloaded_annotations)) as zip_file:
                        clip_files = [f for f in zip_file.namelist() if f.startswith("clips/")]

                        for clip_file in clip_files:
                            with zip_file.open(clip_file) as audio_file:
                                clip_name = os.path.basename(clip_file)
                                if clip_name:
                                    with (clips_path / clip_name).open("wb") as f:
                                        f.write(audio_file.read())

                        if "data.tsv" in zip_file.namelist():
                            with zip_file.open("data.tsv") as tsv_file:
                                reader = csv.DictReader(
                                    io.StringIO(tsv_file.read().decode("utf-8")), delimiter="\t"
                                )
                                entries = [
                                    {key: convert_value(value) for key, value in row.items()}
                                    for row in reader
                                ]

                                annotations.extend(entries)

                with annotations_file.open("w") as f:
                    json.dump(annotations, f, indent=4)

                merged_annotations_archive = io.BytesIO()
                write_dir_to_zip_archive(merged_annotations_path, merged_annotations_archive)
                merged_annotations_archive.seek(0)

                self.merged_annotations = merged_annotations_archive.getvalue()
        else:
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

    ValidationResult = ValidationSuccess | ValidationFailure

    def _process_annotation_results(self) -> ValidationResult:
        assert self.annotation_meta is not None
        assert self.merged_annotations is not None

        # TODO: refactor further
        return process_intermediate_results(
            session=self.db_session,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
            meta=self.annotation_meta,
            merged_annotations=io.BytesIO(self.merged_annotations),
            manifest=self.manifest,
            logger=self.logger,
        )

    def validate(self):
        self._download_results()

        validation_result = self._process_annotation_results()

        self._handle_validation_result(validation_result)

    def _compose_validation_results_bucket_filename(self, filename: str) -> str:
        return f"{self.escrow_address}@{self.chain_id}/{filename}"

    _LOW_QUALITY_REASON_MESSAGE_TEMPLATE = (
        "Annotation quality ({}) is below the required threshold ({})"
    )

    def _handle_validation_result(self, validation_result: ValidationResult):
        logger = self.logger
        escrow_address = self.escrow_address
        chain_id = self.chain_id
        db_session = self.db_session

        if isinstance(validation_result, ValidationSuccess):
            logger.info(
                f"Validation for escrow_address={escrow_address}: successful, "
                f"average annotation quality is {validation_result.average_quality:.2f}"
            )

            recor_merged_annotations_path = self._compose_validation_results_bucket_filename(
                validation.RESULTING_ANNOTATIONS_FILE,
            )

            recor_validation_meta_path = self._compose_validation_results_bucket_filename(
                validation.VALIDATION_METAFILE_NAME,
            )
            validation_metafile = serialize_validation_meta(validation_result.validation_meta)

            storage_client = make_cloud_client(BucketAccessInfo.parse_obj(Config.storage_config))

            # TODO: add encryption
            storage_client.create_file(
                recor_merged_annotations_path,
                validation_result.resulting_annotations,
            )
            storage_client.create_file(
                recor_validation_meta_path,
                validation_metafile,
            )

            escrow.store_results(
                chain_id,
                escrow_address,
                Config.storage_config.bucket_url() + os.path.dirname(recor_merged_annotations_path),  # noqa: PTH120
                compute_resulting_annotations_hash(validation_result.resulting_annotations),
            )

            oracle_db_service.outbox.create_webhook(
                db_session,
                escrow_address,
                chain_id,
                OracleWebhookTypes.reputation_oracle,
                event=RecordingOracleEvent_JobCompleted(),
            )
            oracle_db_service.outbox.create_webhook(
                db_session,
                escrow_address,
                chain_id,
                OracleWebhookTypes.exchange_oracle,
                event=RecordingOracleEvent_JobCompleted(),
            )
        elif isinstance(validation_result, ValidationFailure):
            error_type_counts = Counter(
                type(e).__name__ for e in validation_result.rejected_jobs.values()
            )
            logger.info(
                f"Validation for escrow_address={escrow_address} failed, "
                f"rejected {len(validation_result.rejected_jobs)} jobs. "
                f"Problems: {dict(error_type_counts)}"
            )

            job_id_to_assignment_id = {
                job_meta.job_id: job_meta.assignment_id for job_meta in self.annotation_meta.jobs
            }

            oracle_db_service.outbox.create_webhook(
                db_session,
                escrow_address,
                chain_id,
                OracleWebhookTypes.exchange_oracle,
                event=RecordingOracleEvent_SubmissionRejected(
                    # TODO: send all assignments, handle rejection reason in Exchange Oracle
                    assignments=[
                        RecordingOracleEvent_SubmissionRejected.RejectedAssignmentInfo(
                            assignment_id=job_id_to_assignment_id[rejected_job_id],
                            reason=self._LOW_QUALITY_REASON_MESSAGE_TEMPLATE.format(
                                validation_result.job_results[rejected_job_id],
                                self.manifest.validation.min_quality,
                            ),
                        )
                        for rejected_job_id, reason in validation_result.rejected_jobs.items()
                        if not isinstance(reason, TooFewGtError)
                    ]
                ),
            )
        else:
            raise TypeError(f"Unexpected validation result {type(validation_result)=}")


def validate_results(
    escrow_address: str,
    chain_id: int,
    db_session: Session,
):
    logger = get_function_logger(module_logger_name)

    manifest = parse_manifest(escrow.get_escrow_manifest(chain_id, escrow_address))

    validator = _TaskValidator(
        escrow_address=escrow_address, chain_id=chain_id, manifest=manifest, db_session=db_session
    )
    validator.set_logger(logger)
    validator.validate()
