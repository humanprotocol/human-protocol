from __future__ import annotations

from abc import ABCMeta, abstractmethod
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

from src.handlers.validation.common import _TaskHandler, _ValidationResult

if TYPE_CHECKING:
    from src.core.annotation_meta import AnnotationMeta
    from src.core.gt_stats import GtStats
    from src.core.manifest import ManifestBase
    from src.handlers.validation.common import _JobResults, _RejectedJobs


class TaskQualityChecker(_TaskHandler, metaclass=ABCMeta):
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: ManifestBase,
        *,
        meta: AnnotationMeta,
        gt_stats: GtStats | None = None,
    ) -> None:
        super().__init__(escrow_address=escrow_address, chain_id=chain_id, manifest=manifest)

        self._gt_stats: GtStats = gt_stats or {}

        self._job_results: _JobResults | None = None
        self._rejected_jobs: _RejectedJobs | None = None

        self._temp_dir: Path | None = None
        self._meta: AnnotationMeta = meta

    @abstractmethod
    def _validate_jobs(self) -> None:
        """
        Compute per-job quality and populate:
        ``_job_results``, ``_rejected_jobs``, ``_gt_stats``, ``_task_id_to_val_layout``,
        ``_task_id_to_honeypots_mapping``, ``_task_id_to_sequence_of_frame_names``,
        ``_task_id_to_labels``.
        """

    def validate(self) -> _ValidationResult:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._validate_jobs()

        return _ValidationResult(
            job_results=self._require_field(self._job_results),
            rejected_jobs=self._require_field(self._rejected_jobs),
            gt_stats=self._require_field(self._gt_stats),
            task_id_to_val_layout=self._require_field(self._task_id_to_val_layout),
            task_id_to_honeypots_mapping=self._require_field(self._task_id_to_honeypots_mapping),
            task_id_to_frame_names=self._require_field(self._task_id_to_sequence_of_frame_names),
            task_id_to_labels=self._require_field(self._task_id_to_labels),
        )
