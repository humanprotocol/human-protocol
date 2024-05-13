from typing import List

from pydantic import BaseModel

VALIDATION_METAFILE_NAME = "validation_meta.json"
RESULTING_ANNOTATIONS_FILE = "resulting_annotations.zip"


class JobMeta(BaseModel):
    job_id: int
    final_result_id: int


class ResultMeta(BaseModel):
    id: int
    job_id: int
    annotator_wallet_address: str
    annotation_quality: float


class ValidationMeta(BaseModel):
    jobs: List[JobMeta]
    results: List[ResultMeta]
