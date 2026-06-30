from __future__ import annotations

from src.chain.escrow import get_escrow_manifest
from src.core.types import TaskTypes
from src.handlers.job_creation.builders.audio.transcription import AudioTranscriptionTaskBuilder
from src.handlers.job_creation.builders.vision.basic import (
    PointsTaskBuilder,
    PolygonTaskBuilder,
    SimpleTaskBuilder,
)
from src.handlers.job_creation.builders.vision.boxes_from_points import BoxesFromPointsTaskBuilder
from src.handlers.job_creation.builders.vision.skeletons_from_boxes import (
    SkeletonsFromBoxesTaskBuilder,
)
from src.log import ROOT_LOGGER_NAME
from src.utils.assignments import parse_manifest
from src.utils.logging import get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"


def create_task(escrow_address: str, chain_id: int) -> None:
    logger = get_function_logger(module_logger)

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    if manifest.annotation.type in [TaskTypes.image_boxes, TaskTypes.image_label_binary]:
        builder_type = SimpleTaskBuilder
    elif manifest.annotation.type is TaskTypes.image_polygons:
        builder_type = PolygonTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_points]:
        builder_type = PointsTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_boxes_from_points]:
        builder_type = BoxesFromPointsTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_skeletons_from_boxes]:
        builder_type = SkeletonsFromBoxesTaskBuilder
    elif manifest.annotation.type in [TaskTypes.audio_transcription]:
        builder_type = AudioTranscriptionTaskBuilder
    else:
        raise Exception(f"Unsupported task type {manifest.annotation.type}")

    with builder_type(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()
