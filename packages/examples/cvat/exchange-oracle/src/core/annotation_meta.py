from pathlib import Path
from typing import List

from pydantic import BaseModel

ANNOTATION_RESULTS_METAFILE_NAME = "annotation_meta.json"
RESULTING_ANNOTATIONS_FILE = "resulting_annotations.zip"


class JobMeta(BaseModel):
    job_id: int
    annotation_filename: Path
    annotator_wallet_address: str
    assignment_id: str


class AnnotationMeta(BaseModel):
    jobs: List[JobMeta]
