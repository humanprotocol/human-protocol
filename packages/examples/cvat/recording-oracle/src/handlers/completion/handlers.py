import io
import os
from decimal import Decimal
from logging import Logger

from sqlalchemy.orm import Session

import src.core.annotation_meta as annotation
import src.core.validation_meta as validation
import src.services.validation as db_service
import src.services.webhook as oracle_db_service
from src.chain import escrow
from src.core.config import Config
from src.core.manifest import ManifestBase, parse_manifest
from src.core.oracle_events import RecordingOracleEvent_JobCompleted
from src.core.storage import (
    compose_results_bucket_filename as compose_annotation_results_bucket_filename,
)
from src.core.types import OracleWebhookTypes
from src.core.validation_results import FinalResult
from src.handlers.completion.final_results import process_final_results
from src.handlers.validation import parse_annotation_metafile, serialize_validation_meta
from src.log import ROOT_LOGGER_NAME
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.assignments import compute_resulting_annotations_hash
from src.utils.logging import NullLogger, get_function_logger

module_logger_name = f"{ROOT_LOGGER_NAME}.cron.webhook"


class _EscrowExporter:
    def __init__(
        self, escrow_address: str, chain_id: int, manifest: ManifestBase, db_session: Session
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest
        self.db_session = db_session
        self.logger: Logger = NullLogger()

        self.data_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)

        self.annotation_meta: annotation.AnnotationMeta | None = None

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

    def _download_results(self):
        self._download_results_meta()

    def _process_annotation_results(self) -> FinalResult:
        assert self.annotation_meta is not None

        return process_final_results(
            session=self.db_session,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
            meta=self.annotation_meta,
            manifest=self.manifest,
            logger=self.logger,
        )

    def export(self):
        self._download_results()

        export_result = self._process_annotation_results()

        self._handle_result(export_result)

    def _compose_validation_results_bucket_filename(self, filename: str) -> str:
        return f"{self.escrow_address}@{self.chain_id}/{filename}"

    def _compute_total_bounty(self) -> Decimal | None:
        """
        Computes the total reward for the final assignments.
        Returns None, if the reward is unknown for the assignments.
        """

        assert self.annotation_meta is not None

        assignment_bounties = {
            job_meta.assignment_id: db_service.get_validation_result_by_assignment_id(
                self.db_session, job_meta.assignment_id
            ).assignment_bounty
            for job_meta in self.annotation_meta.jobs
        }

        assignments_without_bounty = [
            assignment_id for assignment_id, bounty in assignment_bounties.items() if bounty is None
        ]
        if assignments_without_bounty:
            # The assignment rewards are expected to be either known for all the assignments
            # or unknown for all of them, otherwise the total reward can't be computed
            if len(assignments_without_bounty) != len(assignment_bounties):
                raise Exception(
                    f"Result uploading for escrow_address={self.escrow_address}: "
                    f"{len(assignments_without_bounty)} of {len(assignment_bounties)} assignments "
                    "have no reward specified. "
                    "Either all the assignments must have bounty specified or none of them."
                )

            return None

        return sum((Decimal(bounty) for bounty in assignment_bounties.values()), start=Decimal(0))

    def _compute_funds_to_reserve(self, total_bounty: Decimal | None) -> int:
        """
        Returns the escrow funds to be reserved for the payouts, in the raw token units.
        All the remaining funds are reserved, the requested reward is only validated.
        """

        remaining_funds = escrow.get_raw_remaining_escrow_funds(self.chain_id, self.escrow_address)

        if total_bounty is not None:
            token_decimals = escrow.get_escrow_fund_token_decimals(
                self.chain_id, self.escrow_address
            )
            requested_funds = total_bounty * 10**token_decimals
            if requested_funds > remaining_funds:
                raise Exception(
                    f"Result uploading for escrow_address={self.escrow_address}: "
                    f"the total assignment reward ({requested_funds}) exceeds "
                    f"the remaining escrow funds ({remaining_funds})"
                )

        self.logger.info(
            f"Result uploading for escrow_address={self.escrow_address}: "
            f"will reserve {remaining_funds} funds on the escrow."
        )

        return remaining_funds

    def _handle_result(self, export_result: FinalResult):
        logger = self.logger
        escrow_address = self.escrow_address
        chain_id = self.chain_id
        db_session = self.db_session

        logger.info(
            f"Result uploading for escrow_address={escrow_address}: successful, "
            f"average quality score is {export_result.average_quality * 100:.2f}%"
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

        funds_to_reserve = self._compute_funds_to_reserve(self._compute_total_bounty())

        escrow.store_results(
            chain_id,
            escrow_address,
            Config.storage_config.bucket_url() + os.path.dirname(recor_merged_annotations_path),  # noqa: PTH120
            compute_resulting_annotations_hash(export_result.resulting_annotations),
            funds_to_reserve=funds_to_reserve,
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

    exporter = _EscrowExporter(
        escrow_address=escrow_address, chain_id=chain_id, manifest=manifest, db_session=db_session
    )
    exporter.set_logger(logger)
    exporter.export()
