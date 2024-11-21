from pathlib import Path

from pydantic import BaseModel

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


class AnnotationMeta(BaseModel):
    jobs: list[JobMeta]
