from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes
from src.handlers.job_export.exporters.audio import AudioTranscriptionJobExporter
from src.handlers.job_export.exporters.vision import (
    BoxesFromPointsJobExporter,
    BoxesJobExporter,
    LabelsJobExporter,
    PointsJobExporter,
    PolygonsJobExporter,
    SkeletonsJobExporter,
)

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.orm import Session

    from src.core.manifest import ManifestBase
    from src.handlers.job_export.exporters.base import JobExporter
    from src.models.cvat import Project


def create_exporter(
    manifest: ManifestBase,
    escrow_address: str,
    chain_id: int,
    session: Session,
    escrow_projects: Sequence[Project],
) -> JobExporter:
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.image_label_binary:
            exporter_type = LabelsJobExporter
        case TaskTypes.image_boxes:
            exporter_type = BoxesJobExporter
        case TaskTypes.image_polygons:
            exporter_type = PolygonsJobExporter
        case TaskTypes.image_points:
            exporter_type = PointsJobExporter
        case TaskTypes.image_boxes_from_points:
            exporter_type = BoxesFromPointsJobExporter
        case TaskTypes.image_skeletons_from_boxes:
            exporter_type = SkeletonsJobExporter
        case TaskTypes.audio_transcription:
            exporter_type = AudioTranscriptionJobExporter
        case _:
            raise NotImplementedError(f"Unsupported task type '{task_type}'")

    return exporter_type(manifest, escrow_address, chain_id, session, escrow_projects)
