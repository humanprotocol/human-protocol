from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes
from src.handlers.job_creation.builders.audio.transcription import AudioTranscriptionTaskBuilder
from src.handlers.job_creation.builders.vision.basic import (
    BoxesTaskBuilder,
    LabelBinaryTaskBuilder,
    PointsTaskBuilder,
    PolygonTaskBuilder,
)
from src.handlers.job_creation.builders.vision.boxes_from_points import BoxesFromPointsTaskBuilder
from src.handlers.job_creation.builders.vision.skeletons_from_boxes import (
    SkeletonsFromBoxesTaskBuilder,
)

if TYPE_CHECKING:
    from src.core.manifest import ManifestBase
    from src.handlers.job_creation.builders.vision.base import TaskBuilderBase


def create_builder(
    manifest: ManifestBase,
    escrow_address: str,
    chain_id: int,
) -> TaskBuilderBase:
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.image_boxes:
            builder_type = BoxesTaskBuilder
        case TaskTypes.image_label_binary:
            builder_type = LabelBinaryTaskBuilder
        case TaskTypes.image_polygons:
            builder_type = PolygonTaskBuilder
        case TaskTypes.image_points:
            builder_type = PointsTaskBuilder
        case TaskTypes.image_boxes_from_points:
            builder_type = BoxesFromPointsTaskBuilder
        case TaskTypes.image_skeletons_from_boxes:
            builder_type = SkeletonsFromBoxesTaskBuilder
        case TaskTypes.audio_transcription:
            builder_type = AudioTranscriptionTaskBuilder
        case _:
            raise NotImplementedError(f"Unsupported task type '{task_type}'")

    return builder_type(manifest, escrow_address, chain_id)
