from __future__ import annotations

from typing import TYPE_CHECKING

from src.chain.escrow import get_escrow_manifest
from src.core.manifest import get_manifest_task_type, parse_manifest
from src.core.tasks import TaskTypes
from src.handlers.job_completion.validators.audio import AudioTranscriptionJobValidator
from src.handlers.job_completion.validators.base import JobValidator

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.orm import Session

    from src.models.cvat import Project


def create_validator(
    escrow_address: str,
    chain_id: int,
    session: Session,
    escrow_projects: Sequence[Project],
) -> JobValidator:
    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))
    task_type = get_manifest_task_type(manifest)

    match task_type:
        case TaskTypes.audio_transcription:
            validator_cls = AudioTranscriptionJobValidator
        case (
            TaskTypes.image_label_binary
            | TaskTypes.image_boxes
            | TaskTypes.image_polygons
            | TaskTypes.image_points
            | TaskTypes.image_boxes_from_points
            | TaskTypes.image_skeletons_from_boxes
        ):
            validator_cls = JobValidator
        case _:
            raise Exception(f"Unsupported task type {task_type}")

    return validator_cls(escrow_address, chain_id, session, escrow_projects)
