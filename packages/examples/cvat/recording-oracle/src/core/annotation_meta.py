from __future__ import annotations

from typing import TYPE_CHECKING

from pathlib import Path
from pydantic import BaseModel

if TYPE_CHECKING:
    from collections.abc import Collection, Iterator

ANNOTATION_RESULTS_METAFILE_NAME = "annotation_meta.json"
RESULTING_ANNOTATIONS_FILE = "resulting_annotations.zip"


class JobMeta(BaseModel):
    job_id: int
    task_id: int
    annotation_filename: Path
    annotator_wallet_address: str
    assignment_id: str
    start_frame: int
    stop_frame: int

    @property
    def job_frame_range(self) -> Iterator[int]:
        return range(self.start_frame, self.stop_frame + 1)


class AnnotationMeta(BaseModel):
    jobs: list[JobMeta]

    def skip_assignments(self, assignment_ids: Collection[int]) -> AnnotationMeta:
        return AnnotationMeta(
            jobs=[job for job in self.jobs if job.assignment_id not in assignment_ids]
        )
