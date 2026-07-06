from __future__ import annotations

from src.chain.escrow import get_escrow_manifest
from src.core.manifest import get_manifest_task_type, parse_manifest
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
from src.log import ROOT_LOGGER_NAME
from src.utils.logging import get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"


def create_task(escrow_address: str, chain_id: int) -> None:
    logger = get_function_logger(module_logger)

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))
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

    with builder_type(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()
