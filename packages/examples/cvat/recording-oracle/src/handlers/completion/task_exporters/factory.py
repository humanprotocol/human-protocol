from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes
from src.handlers.completion.task_exporters.audio import AudioTaskExporter
from src.handlers.completion.task_exporters.image import ImageTaskExporter

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from src.core.manifest import ManifestBase
    from src.handlers.completion.task_exporters.base import TaskExporter


def create_exporter(
    manifest: ManifestBase,
    escrow_address: str,
    chain_id: int,
    session: Session,
) -> TaskExporter:
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.audio_transcription:
            exporter_type = AudioTaskExporter
        case (
            TaskTypes.image_label_binary
            | TaskTypes.image_boxes
            | TaskTypes.image_polygons
            | TaskTypes.image_points
            | TaskTypes.image_boxes_from_points
            | TaskTypes.image_skeletons_from_boxes
        ):
            exporter_type = ImageTaskExporter
        case _:
            raise NotImplementedError(f"Unsupported task type '{task_type}'")

    return exporter_type(escrow_address, chain_id, manifest, session)
