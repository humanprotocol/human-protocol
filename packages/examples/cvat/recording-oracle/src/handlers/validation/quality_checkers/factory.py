from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes
from src.handlers.validation.quality_checkers.audio import AudioTaskQualityChecker
from src.handlers.validation.quality_checkers.image import ImageTaskQualityChecker

if TYPE_CHECKING:
    from src.core.annotation_meta import AnnotationMeta
    from src.core.gt_stats import GtStats
    from src.core.manifest import ManifestBase
    from src.handlers.validation.quality_checkers.base import TaskQualityChecker


def create_quality_checker(
    manifest: ManifestBase,
    escrow_address: str,
    chain_id: int,
    *,
    meta: AnnotationMeta,
    gt_stats: GtStats | None = None,
) -> TaskQualityChecker:
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.audio_transcription:
            checker_type = AudioTaskQualityChecker
        case (
            TaskTypes.image_label_binary
            | TaskTypes.image_boxes
            | TaskTypes.image_polygons
            | TaskTypes.image_points
            | TaskTypes.image_boxes_from_points
            | TaskTypes.image_skeletons_from_boxes
        ):
            checker_type = ImageTaskQualityChecker
        case _:
            raise NotImplementedError(f"Unsupported task type '{task_type}'")

    return checker_type(escrow_address, chain_id, manifest, meta=meta, gt_stats=gt_stats)
