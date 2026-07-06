from __future__ import annotations

from typing import TYPE_CHECKING

from src.handlers.job_export.exporters.base import JobExporter

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.orm import Session

    from src.models.cvat import Project


class AudioTranscriptionJobExporter(JobExporter):
    """Export flow for audio_transcription escrows.

    FUTURE-TODO: read the interval (transcription) annotations from the annotation jobs, map placed
    regions back to source via the persisted assignments/regions meta, and score against GT (WER).
    """

    def export(self, session: Session, escrow_projects: Sequence[Project]) -> None:
        raise NotImplementedError("audio_transcription export is not implemented yet")
