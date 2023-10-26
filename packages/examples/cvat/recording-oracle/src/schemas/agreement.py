from typing import Generic, Mapping, Optional, Sequence, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ImageLabelBinaryFinalResult(BaseModel):
    url: str
    label: str
    label_counts: Mapping[str, int]
    score: float


class AgreementEstimate(BaseModel):
    score: float
    interval: Optional[tuple[float, float]]
    alpha: Optional[float]


class ResultDataset(BaseModel, Generic[T]):
    dataset_scores: Mapping[str, AgreementEstimate]
    data_points: Sequence[T]


class WorkerPerformanceResult(BaseModel):
    worker_id: str
    consensus_annotations: int
    total_annotations: int
    score: float


class ImageLabelBinaryJobResults(BaseModel):
    dataset: ResultDataset[ImageLabelBinaryFinalResult]
    worker_performance: Sequence[WorkerPerformanceResult]
