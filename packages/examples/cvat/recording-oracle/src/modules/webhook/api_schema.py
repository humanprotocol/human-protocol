from typing import Mapping, Optional, Generic, Sequence, TypeVar

from pydantic import BaseModel, validator

from src.constants import Networks
from src.modules.chain.web3 import validate_address

T = TypeVar("T")


class OracleWebhook(BaseModel):
    escrow_address: str
    chain_id: Networks
    s3_url: str

    @validator("escrow_address", allow_reuse=True)
    def validate_escrow_(cls, value):
        return validate_address(value)

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "chain_id": 80001,
                "s3_url": "https://cvat-eo-results.storage.googleapis.com/s3c7d8121830b8bdfd37157ae99a1336206c0a061c.json",
            }
        }


class OracleWebhookResponse(BaseModel):
    id: str


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
