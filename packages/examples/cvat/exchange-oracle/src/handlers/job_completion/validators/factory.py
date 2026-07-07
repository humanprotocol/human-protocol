from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.manifest import ManifestBase, get_manifest_task_type
from src.core.tasks import TaskTypes
from src.handlers.job_completion.validators.audio import AudioTranscriptionJobValidator
from src.handlers.job_completion.validators.base import JobValidator

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.orm import Session

    from src.models.cvat import Project


def create_validator(
    manifest: ManifestBase,
    escrow_address: str,
    chain_id: int,
    session: Session,
    escrow_projects: Sequence[Project],
) -> JobValidator:
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.audio_transcription:
            validator_type = AudioTranscriptionJobValidator
        case (
            TaskTypes.image_label_binary
            | TaskTypes.image_boxes
            | TaskTypes.image_polygons
            | TaskTypes.image_points
            | TaskTypes.image_boxes_from_points
            | TaskTypes.image_skeletons_from_boxes
        ):
            validator_type = JobValidator
        case _:
            raise NotADirectoryError(f"Unsupported task type '{task_type}'")

    return validator_type(escrow_address, chain_id, session, escrow_projects)
