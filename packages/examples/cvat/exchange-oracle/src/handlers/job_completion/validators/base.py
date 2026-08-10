from __future__ import annotations

from contextlib import ExitStack
from typing import TYPE_CHECKING

import src.services.cvat as cvat_service
import src.services.webhook as oracle_db_service
from src.core.oracle_events import ExchangeOracleEvent_JobFinished
from src.core.types import OracleWebhookTypes
from src.handlers.job_export.results import prepare_annotation_metafile, upload_escrow_results
from src.utils.logging import NullLogger

if TYPE_CHECKING:
    from collections.abc import Sequence
    from logging import Logger

    from sqlalchemy.orm import Session

    from src.handlers.job_export.results import FileDescriptor
    from src.models.cvat import Project


class JobValidator:
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        session: Session,
        escrow_projects: Sequence[Project],
    ) -> None:
        self.exit_stack = ExitStack()
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.session = session
        self.escrow_projects = escrow_projects

        self.logger: Logger = NullLogger()

    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        self.close()

    def close(self):
        self.exit_stack.close()

    def set_logger(self, logger: Logger):
        self.logger = logger
        return self

    def validate(self) -> None:
        self._save_annotation_results()
        self._notify()

    def _save_annotation_results(self) -> None:
        # TODO: maybe upload only current iteration jobs
        jobs = cvat_service.get_jobs_by_escrow_address(
            self.session, self.escrow_address, self.chain_id
        )
        result_files: list[FileDescriptor] = [prepare_annotation_metafile(jobs=jobs)]

        self.logger.debug(
            f"Uploading assignment info for the escrow (escrow_address={self.escrow_address})"
        )
        upload_escrow_results(
            files=result_files, chain_id=self.chain_id, escrow_address=self.escrow_address
        )

    def _notify(self) -> None:
        oracle_db_service.outbox.create_webhook(
            self.session,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
            type=OracleWebhookTypes.recording_oracle,
            event=ExchangeOracleEvent_JobFinished(),
        )
        self.logger.info(
            f"The escrow (escrow_address={self.escrow_address}) annotation is finished, "
            "requesting validation"
        )
