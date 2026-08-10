from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, TypeVar

import src.cvat.api_calls as cvat_api
from src.core.validation_errors import DatasetValidationError

if TYPE_CHECKING:
    from pathlib import Path

    from src.core.gt_stats import GtStats
    from src.core.manifest import ManifestBase

UNKNOWN_QUALITY = -1
"The value to be used when job quality cannot be computed (e.g. no GT images available)"

_JobResults = dict[int, float]

_RejectedJobs = dict[int, DatasetValidationError]

_HoneypotFrameId = int
_ValidationFrameId = int
_HoneypotFrameToValFrame = dict[_HoneypotFrameId, _ValidationFrameId]
_TaskIdToValidationLayout = dict[int, cvat_api.models.ITaskValidationLayoutRead]
_TaskIdToHoneypotsMapping = dict[int, _HoneypotFrameToValFrame]
_TaskIdToFrameNames = dict[int, list[str]]
_TaskIdToLabels = dict[int, list[str]]


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    gt_stats: GtStats
    task_id_to_val_layout: _TaskIdToValidationLayout
    task_id_to_honeypots_mapping: _TaskIdToHoneypotsMapping
    task_id_to_frame_names: _TaskIdToFrameNames
    task_id_to_labels: _TaskIdToLabels


@dataclass
class _HoneypotUpdateResult:
    updated_gt_stats: GtStats
    can_continue_annotation: bool


T = TypeVar("T")


class _TaskHandler:
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: ManifestBase,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._temp_dir: Path | None = None

    def _require_field(self, field: T | None) -> T:
        assert field is not None
        return field
