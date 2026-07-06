from __future__ import annotations

from typing import cast

from src.chain.escrow import get_escrow_manifest
from src.core import manifest as manifest_utils
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

    manifest = manifest_utils.parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    if manifest.version == 1:
        manifest = cast("manifest_utils.v1.JobManifest", manifest)
        task_type = manifest.annotation.type
    elif manifest.version == 2:
        manifest = cast("manifest_utils.v2.JobManifest", manifest)
        task_type = manifest.job_type
    else:
        raise NotImplementedError(f"Unknown manifest version '{manifest.version}'")

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
            raise Exception(f"Unsupported task type {task_type}")

    with builder_type(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()
