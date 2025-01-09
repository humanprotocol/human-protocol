from pydantic import BaseModel


class AnnotationInfo(BaseModel):
    precision: float | int
    accuracy: float | int


class FrameResult(BaseModel):
    annotations: AnnotationInfo


class QualityReportData(BaseModel):
    frame_results: dict[str, FrameResult]


class QualitySettings(BaseModel):
    target_metric: str
