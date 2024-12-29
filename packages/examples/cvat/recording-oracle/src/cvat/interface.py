from pydantic import BaseModel


class AnnotationInfo(BaseModel):
    precision: float | int


class FrameResult(BaseModel):
    conflicts: list[dict]
    annotations: AnnotationInfo


class QualityReportData(BaseModel):
    frame_results: dict[str, FrameResult]
