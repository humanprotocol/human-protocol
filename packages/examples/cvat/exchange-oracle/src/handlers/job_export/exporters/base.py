from __future__ import annotations

from abc import ABCMeta, abstractmethod
from contextlib import ExitStack
from typing import TYPE_CHECKING

import src.services.webhook as oracle_db_service
from src.core.oracle_events import ExchangeOracleEvent_EscrowRecorded
from src.core.types import OracleWebhookTypes
from src.handlers.job_export.results import upload_escrow_results
from src.utils.logging import NullLogger

if TYPE_CHECKING:
    from collections.abc import Sequence
    from logging import Logger

    from sqlalchemy.orm import Session

    from src.core.manifest import ManifestBase
    from src.handlers.job_export.results import FileDescriptor
    from src.models.cvat import Project


class JobExporter(metaclass=ABCMeta):
    """
    Base for task-specific escrow annotation exporters.

    Subclasses must implement :meth:`export`
    """

    def __init__(self, manifest: ManifestBase, escrow_address: str, chain_id: int) -> None:
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

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

    @abstractmethod
    def export(self, session: Session, escrow_projects: Sequence[Project]) -> None: ...

    def _upload_results(self, files: Sequence[FileDescriptor]) -> None:
        upload_escrow_results(
            files=files, chain_id=self.chain_id, escrow_address=self.escrow_address
        )

    def _emit_escrow_recorded(self, session: Session) -> None:
        oracle_db_service.outbox.create_webhook(
            session,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
            type=OracleWebhookTypes.recording_oracle,
            event=ExchangeOracleEvent_EscrowRecorded(),
        )
