from __future__ import annotations

from src.handlers.validation.quality_checkers.base import TaskQualityChecker


class AudioTaskQualityChecker(TaskQualityChecker):
    def _validate_jobs(self) -> None:
        raise NotImplementedError("audio_transcription validation not implemented yet")
